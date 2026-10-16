import { useEffect } from "react";
import { Bell, Mail } from "lucide-react";
import { useUser } from "../context/UserContext";
import { formatDate } from "../lib/campaignUtils";
import "./Campaigns.css";

export function Notifications() {
  const { user, notifications, markNotificationsRead } = useUser();
  const inbox = notifications.filter((n) => n.recipientEmail === user?.email);

  useEffect(() => {
    // Mark as read once the inbox has been viewed.
    const timer = setTimeout(markNotificationsRead, 1500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inbox.length]);

  return (
    <main className="panel__main">
      <div>
        <h1 className="panel__heading">Notificaciones</h1>
        <p className="panel__subheading">Correos enviados a {user?.email}</p>
      </div>

      {inbox.length === 0 ? (
        <div className="panel__card empty-state">
          <Bell size={28} />
          <p className="empty-state__title">Sin notificaciones</p>
          <p className="empty-state__text">
            Aquí verás los comprobantes de tus aportes y avisos de las campañas que apoyas.
          </p>
        </div>
      ) : (
        <div className="panel__list">
          {inbox.map((n) => (
            <article key={n.id} className={`mail-item${n.read ? "" : " mail-item--unread"}`}>
              <div className="mail-item__icon">
                <Mail size={16} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div className="mail-item__head">
                  <p className="panel__list-label">{n.subject}</p>
                  <span className="panel__list-sub">{formatDate(n.date)}</span>
                </div>
                <p className="mail-item__body">{n.body}</p>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
