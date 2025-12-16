import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";

interface Conversation {
  id: string;
  participant_a_id: string;
  participant_b_id: string;
  last_message_at: string | null;
  last_message_preview: string | null;
  other_participant: {
    id: string;
    name: string | null;
    email: string | null;
    avatar_url: string | null;
  } | null;
  unread_count: number;
}

const ChatInbox = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadConversations = async () => {
      if (!user) return;

      setLoading(true);

      const { data, error } = await supabase.rpc("get_user_conversations", {
        p_user_id: user.id,
      });

      if (!error && data) {
        setConversations(data as Conversation[]);
      }

      setLoading(false);
    };

    loadConversations();
  }, [user]);

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Messages</h1>
        <p className="text-muted-foreground">Chat with buyers and sellers.</p>
      </div>

      <Card className="border border-border/60 bg-card/80 backdrop-blur-xl shadow-glass" >
        <CardHeader>
          <CardTitle>Conversations</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          ) : conversations.length === 0 ? (
            <p className="text-sm text-muted-foreground">No conversations yet.</p>
          ) : (
            <div className="divide-y divide-border">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => navigate(`/app/chat/${conv.id}`)}
                  className="w-full flex items-center gap-3 py-3 hover:bg-muted/60 transition-colors text-left px-2 rounded-lg"
                >
                  <Avatar className="w-10 h-10">
                    {conv.other_participant?.avatar_url && (
                      <AvatarImage
                        src={conv.other_participant.avatar_url}
                        alt={conv.other_participant.name || "User"}
                      />
                    )}
                    <AvatarFallback>
                      {conv.other_participant?.name?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-medium truncate">
                        {conv.other_participant?.name ||
                          conv.other_participant?.email ||
                          "User"}
                      </span>
                      {conv.last_message_at && (
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDistanceToNow(new Date(conv.last_message_at), {
                            addSuffix: true,
                          })}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-muted-foreground truncate">
                        {conv.last_message_preview || "No messages yet"}
                      </span>
                      {conv.unread_count > 0 && (
                        <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold">
                          {conv.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ChatInbox;

