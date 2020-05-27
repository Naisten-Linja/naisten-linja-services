import React, { useState, useContext, useEffect, useCallback } from 'react';
import styled from 'styled-components';

interface Notification {
  type: 'error' | 'info' | 'warning' | 'success';
  message: string;
  timestamp: number;
}

export type AddNotificationParams = Omit<Notification, 'timestamp'>;

interface INotificationContext {
  addNotification: (message: Notification) => void;
  deleteNotification: (timestamp: number) => void;
  clearAllNotifications: () => void;
  notifications: Array<Notification>;
}

const NotificationsContext = React.createContext<INotificationContext>({
  // @ts-ignore
  addNotification: () => {},
  deleteNotification: () => {},
  clearAllNotifications: () => {},
  notifications: [],
});

export const NotificationsContextWrapper: React.FunctionComponent = ({ children }) => {
  const [notifications, setNotifications] = useState<Array<Notification>>([]);

  useEffect(() => {
    const eventHandler = (e: CustomEvent<{ message: Notification }>) => {
      setNotifications([...notifications, e.detail.message]);
    };
    // @ts-ignore
    window.addEventListener('AddNotification', eventHandler);
    // @ts-ignore
    return () => window.removeEventListener('AddNotification', eventHandler);
  }, [notifications]);

  const addNotification = useCallback((message: Notification) => {
    const event = new CustomEvent<{ message: Notification }>('addNotification');
    event.initCustomEvent('AddNotification', false, false, { message });
    window.dispatchEvent(event);
  }, []);

  const deleteNotification = (timestamp: number) => {
    if (notifications.find((n) => n.timestamp === timestamp)) {
      setNotifications(notifications.filter((n) => n.timestamp !== timestamp));
    }
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  useEffect(() => {
    const expireNotifications = setInterval(() => {
      const lifeTime = 8000;
      notifications.forEach((n) => {
        if (n.timestamp + lifeTime < Date.now()) {
          deleteNotification(n.timestamp);
        }
      });
    }, 500);
    return () => clearInterval(expireNotifications);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deleteNotification]);

  return (
    <NotificationsContext.Provider
      value={{
        addNotification,
        notifications,
        deleteNotification,
        clearAllNotifications,
      }}
    >
      <NotificationContainer>
        {notifications.map((n) => (
          <NotificationItem
            key={`notification-${n.type}-${n.timestamp}`}
            type={n.type}
            onClick={() => deleteNotification(n.timestamp)}
          >
            {n.message}
          </NotificationItem>
        ))}
      </NotificationContainer>
      {children}
    </NotificationsContext.Provider>
  );
};

export function useNotifications() {
  return useContext(NotificationsContext);
}

const NotificationContainer = styled.div`
  position: fixed;
  width: 18rem;
  bottom: 2rem;
  right: 2rem;
  background: 'red';
`;

const NotificationItem = styled.div<{ type: Notification['type'] }>`
  padding: 0.5rem 0.5rem;
  border: 1px solid ${({ type }) => `var(--${type})`};
  border-radius: 0.1rem;
  margin: 0.2rem 0;
  width: 100%;
  background: var(--white);
  -webkit-box-shadow: -1px 1px 2px -2px rgba(0, 0, 0, 0.75);
  -moz-box-shadow: -1px 1px 2px -2px rgba(0, 0, 0, 0.75);
  box-shadow: -1px 1px 2px -2px rgba(0, 0, 0, 0.75);
`;
