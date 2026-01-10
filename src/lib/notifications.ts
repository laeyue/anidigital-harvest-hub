import { supabase } from './supabase';

export interface NotificationData {
  user_id: string;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
}

/**
 * Create a notification for a user
 */
export const createNotification = async (notification: NotificationData) => {
  const { data, error } = await supabase
    .from('notifications')
    .insert({
      user_id: notification.user_id,
      title: notification.title,
      message: notification.message,
      type: notification.type || 'info',
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating notification:', error);
    return null;
  }

  return data;
};

/**
 * Create a notification when a transaction is added
 */
export const createTransactionNotification = async (userId: string, type: 'income' | 'expense', amount: number, description: string) => {
  const notificationType = type === 'income' ? 'success' : 'info';
  const title = type === 'income' ? 'Payment Received' : 'Expense Recorded';
  const message = type === 'income' 
    ? `You received PHP ${amount.toLocaleString()}: ${description}`
    : `Expense of PHP ${amount.toLocaleString()} recorded: ${description}`;

  return createNotification({
    user_id: userId,
    title,
    message,
    type: notificationType,
  });
};

/**
 * Create a notification when a product is listed
 */
export const createProductListedNotification = async (userId: string, productName: string) => {
  return createNotification({
    user_id: userId,
    title: 'Product Listed',
    message: `Your product "${productName}" has been successfully listed in the marketplace.`,
    type: 'success',
  });
};

/**
 * Create a notification for weather alerts
 */
export const createWeatherAlertNotification = async (userId: string, message: string) => {
  return createNotification({
    user_id: userId,
    title: 'Weather Alert',
    message,
    type: 'warning',
  });
};

