import { Bell, Search, Menu, Package, User, Store, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";

interface AppHeaderProps {
  onMenuClick: () => void;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
}

const AppHeader = ({ onMenuClick }: AppHeaderProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [conversations, setConversations] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ products: any[]; farmers: any[]; shops: any[] }>({ products: [], farmers: [], shops: [] });
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      loadProfile();
      loadNotifications();
      loadUnreadMessages();
    }
  }, [user]);

  // Poll for unread messages every 5 seconds
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      loadUnreadMessages();
    }, 5000);

    return () => clearInterval(interval);
  }, [user]);

  // Close search dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Search for products, farmers, and shops as user types
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.trim().length < 2) {
      setSearchResults({ products: [], farmers: [], shops: [] });
      setIsSearchOpen(false);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      await performSearch(searchQuery.trim());
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const performSearch = async (query: string) => {
    try {
      // Search products
      const { data: productsData } = await supabase
        .from('products')
        .select('id, name, price, unit, category, seller_id, profiles:seller_id(name)')
        .ilike('name', `%${query}%`)
        .limit(5);

      // Search farmers/profiles
      const { data: farmersData } = await supabase
        .from('profiles')
        .select('id, name, email')
        .ilike('name', `%${query}%`)
        .limit(5);

      // Search shops
      const { data: shopsData } = await supabase
        .from('shops')
        .select('id, name, description, location, profiles:owner_id(name)')
        .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
        .limit(5);

      setSearchResults({
        products: productsData || [],
        farmers: farmersData || [],
        shops: shopsData || [],
      });

      if ((productsData && productsData.length > 0) || (farmersData && farmersData.length > 0) || (shopsData && shopsData.length > 0)) {
        setIsSearchOpen(true);
      } else {
        setIsSearchOpen(false);
      }
    } catch (error) {
      console.error('Error searching:', error);
      setIsSearchOpen(false);
    }
  };

  const loadProfile = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('profiles')
      .select('name, role, avatar_url')
      .eq('id', user.id)
      .single();

    if (error && (error.code === 'PGRST116' || error.message?.includes('No rows') || error.message?.includes('0 rows'))) {
      // Profile doesn't exist, create one
      const { data: newProfile } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          name: user.user_metadata?.name || user.email?.split('@')[0] || "User",
          email: user.email || "",
          role: user.user_metadata?.role || "farmer",
        })
        .select('name, role, avatar_url')
        .single();
      setProfile(newProfile);
    } else if (data) {
      setProfile(data);
    }
  };

  const updateTotalUnreadCount = () => {
    const notificationUnread = notifications.filter((n) => !n.read).length;
    setUnreadCount(notificationUnread + unreadMessagesCount);
  };

  useEffect(() => {
    updateTotalUnreadCount();
  }, [notifications, unreadMessagesCount]);

  const loadNotifications = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (!error && data) {
      setNotifications(data);
    }
  };

  const markAsRead = async (notificationId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)
      .eq('user_id', user.id);

    if (!error) {
      // Update local state
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    // Mark all notifications as read
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false);

    if (!error) {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      // Note: Message unread counts are handled when viewing conversations
      // The useEffect will automatically update the total count
    }
  };

  const loadUnreadMessages = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.rpc("get_user_conversations", {
        p_user_id: user.id,
      });

      if (error) {
        console.error('Error loading unread messages:', error);
        return;
      }

      if (data) {
        const conversationsData = data as any[];
        setConversations(conversationsData);
        const totalUnread = conversationsData.reduce((sum, conv) => sum + (conv.unread_count || 0), 0);
        setUnreadMessagesCount(totalUnread);
      }
    } catch (err) {
      console.error('Error in loadUnreadMessages:', err);
    }
  };

  const handleSearch = (e?: React.FormEvent | React.KeyboardEvent) => {
    if (e) {
      e.preventDefault();
    }
    setIsSearchOpen(false);
    if (searchQuery.trim()) {
      navigate(`/app/marketplace?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/app/marketplace');
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch(e);
    } else if (e.key === 'Escape') {
      setIsSearchOpen(false);
    }
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    if (e.target.value.trim().length >= 2) {
      setIsSearchOpen(true);
    }
  };

  const handleResultClick = (type: 'product' | 'farmer' | 'shop', id: string, name: string) => {
    setIsSearchOpen(false);
    setSearchQuery(name);
    
    if (type === 'shop') {
      navigate(`/app/shop/${id}`);
    } else {
      navigate(`/app/marketplace?search=${encodeURIComponent(name)}`);
    }
  };

  return (
    <header className="h-16 bg-white/80 backdrop-blur-xl border-b border-border/50 px-4 md:px-6 flex items-center justify-between sticky top-0 z-50">
      {/* Left side */}
      <div className="flex items-center gap-4">
        <button
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onMenuClick();
          }}
          className="lg:hidden p-2 rounded-lg hover:bg-muted active:bg-muted transition-colors relative z-50 touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer"
          aria-label="Toggle menu"
          type="button"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          <Menu className="w-6 h-6 pointer-events-none" />
        </button>
        
        <div ref={searchContainerRef} className="hidden md:block relative">
          <form onSubmit={handleSearch} className="flex items-center gap-2 bg-muted rounded-xl px-4 py-2">
            <Search className="w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search products, farmers, shops..."
              className="border-0 bg-transparent focus-visible:ring-0 h-8 w-64"
              value={searchQuery}
              onChange={handleSearchInputChange}
              onKeyDown={handleSearchKeyDown}
              onFocus={() => {
                if (searchQuery.trim().length >= 2 && (searchResults.products.length > 0 || searchResults.farmers.length > 0 || searchResults.shops.length > 0)) {
                  setIsSearchOpen(true);
                }
              }}
            />
          </form>
          
          {isSearchOpen && (searchResults.products.length > 0 || searchResults.farmers.length > 0 || searchResults.shops.length > 0) && (
            <div className="absolute top-full left-0 mt-2 w-[384px] z-50 rounded-md border bg-popover shadow-md p-0">
                <div className="max-h-[400px] overflow-y-auto">
                  {searchResults.products.length > 0 && (
                    <div className="p-2">
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Products</div>
                      {searchResults.products.map((product) => (
                        <button
                          key={product.id}
                          onClick={() => handleResultClick('product', product.id, product.name)}
                          className="w-full flex items-center gap-3 px-2 py-2 rounded-md hover:bg-muted transition-colors text-left"
                        >
                          <Package className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{product.name}</div>
                            <div className="text-xs text-muted-foreground">
                              PHP {Number(product.price).toLocaleString()}/{product.unit} • {product.category}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {searchResults.farmers.length > 0 && (
                    <div className="p-2">
                      {searchResults.products.length > 0 && <div className="h-px bg-border my-2" />}
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Farmers</div>
                      {searchResults.farmers.map((farmer) => (
                        <button
                          key={farmer.id}
                          onClick={() => handleResultClick('farmer', farmer.id, farmer.name)}
                          className="w-full flex items-center gap-3 px-2 py-2 rounded-md hover:bg-muted transition-colors text-left"
                        >
                          <User className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{farmer.name}</div>
                            <div className="text-xs text-muted-foreground truncate">{farmer.email}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {searchResults.shops.length > 0 && (
                    <div className="p-2">
                      {(searchResults.products.length > 0 || searchResults.farmers.length > 0) && <div className="h-px bg-border my-2" />}
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Shops</div>
                      {searchResults.shops.map((shop) => (
                        <button
                          key={shop.id}
                          onClick={() => handleResultClick('shop', shop.id, shop.name)}
                          className="w-full flex items-center gap-3 px-2 py-2 rounded-md hover:bg-muted transition-colors text-left"
                        >
                          <Store className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{shop.name}</div>
                            {shop.profiles && (
                              <div className="text-xs text-muted-foreground truncate">
                                By {shop.profiles.name}
                              </div>
                            )}
                            {shop.location && (
                              <div className="text-xs text-muted-foreground truncate">
                                {shop.location}
                              </div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  
                  <div className="p-2 border-t">
                    <button
                      onClick={handleSearch}
                      className="w-full text-center text-sm text-primary hover:underline py-1"
                    >
                      View all results for "{searchQuery}"
                    </button>
                  </div>
                </div>
            </div>
          )}
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 max-h-[400px] overflow-y-auto scrollbar-hide">
            <div className="flex items-center justify-between px-2 py-1.5">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-primary hover:underline"
                >
                  Mark all as read
                </button>
              )}
            </div>
            <DropdownMenuSeparator />
            
            {/* Unread Messages Section */}
            {unreadMessagesCount > 0 && (
              <>
                {conversations
                  .filter((conv) => conv.unread_count > 0)
                  .slice(0, 5)
                  .map((conv) => (
                    <DropdownMenuItem
                      key={`msg-${conv.id}`}
                      className="flex flex-col items-start gap-1 py-3 cursor-pointer bg-muted/50"
                      onClick={() => navigate(`/app/chat/${conv.id}`)}
                    >
                      <div className="flex items-start justify-between w-full">
                        <div className="flex items-center gap-2">
                          <MessageCircle className="w-4 h-4 text-primary" />
                          <span className="font-medium">
                            {conv.other_participant?.name || conv.other_participant?.email || "User"}
                          </span>
                        </div>
                        {conv.unread_count > 0 && (
                          <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                            {conv.unread_count}
                          </span>
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {conv.last_message_preview || "New message"}
                      </span>
                      {conv.last_message_at && (
                        <span className="text-xs text-muted-foreground">
                          {new Date(conv.last_message_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      )}
                    </DropdownMenuItem>
                  ))}
                {notifications.length > 0 && (
                  <DropdownMenuSeparator />
                )}
              </>
            )}

            {/* Regular Notifications */}
            {notifications.length === 0 && unreadMessagesCount === 0 ? (
              <div className="p-6 text-center">
                <p className="text-sm text-muted-foreground">No notifications</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  className={`flex flex-col items-start gap-1 py-3 cursor-pointer ${
                    !notification.read ? 'bg-muted/50' : ''
                  }`}
                  onClick={() => !notification.read && markAsRead(notification.id)}
                >
                  <div className="flex items-start justify-between w-full">
                    <span className="font-medium">{notification.title}</span>
                    {!notification.read && (
                      <span className="w-2 h-2 bg-primary rounded-full mt-1.5 flex-shrink-0" />
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground">{notification.message}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(notification.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 pl-3 pr-1 py-1 rounded-full bg-muted hover:bg-muted/80 transition-colors">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium">
                  {profile?.name || user.user_metadata?.name || user.email?.split('@')[0] || "User"}
                </p>
                <p className="text-xs text-muted-foreground">{profile?.role || user.user_metadata?.role || "User"}</p>
              </div>
              <img
                src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.name || user.user_metadata?.name || user.email?.split('@')[0] || "User")}&background=15260%32&color=fff`}
                alt={profile?.name || user.user_metadata?.name || user.email?.split('@')[0] || "User"}
                className="w-9 h-9 rounded-full object-cover border-2 border-primary/20"
              />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/app/profile">Profile Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/app/finances">Financial Summary</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/app/chat" className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  <span>Messages</span>
                </div>
                {unreadMessagesCount > 0 && (
                  <span className="ml-auto inline-flex items-center justify-center min-w-[20px] px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                    {unreadMessagesCount > 99 ? '99+' : unreadMessagesCount}
                  </span>
                )}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="text-destructive">
              <Link to="/">Log out</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default AppHeader;
