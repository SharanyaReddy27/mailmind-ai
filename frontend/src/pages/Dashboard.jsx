import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  CalendarClock,
  CheckSquare,
  Inbox as InboxIcon,
  Mail,
  MailOpen,
  Plug,
  Sparkles,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";
import EmailCard from "../components/EmailCard";
import ErrorMessage from "../components/ErrorMessage";
import LoadingSpinner from "../components/LoadingSpinner";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function formatRelativeDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function senderDomain(email) {
  const address = email.senderEmail || email.email || "";
  const at = address.split("@")[1];
  return at ? at.toLowerCase() : "Unknown";
}

const PRIORITY_ORDER = ["High", "Medium", "Low"];

function Dashboard() {
  const { currentUser } = useAuth();
  const [status, setStatus] = useState("checking");
  const [backendMessage, setBackendMessage] = useState(
    "Checking backend connection..."
  );
  const [emails, setEmails] = useState([]);
  const [emailsLoading, setEmailsLoading] = useState(true);
  const [emailsError, setEmailsError] = useState("");

  useEffect(() => {
    api
      .get("/health")
      .then((response) => {
        setBackendMessage(response.data.message);
        setStatus("online");
      })
      .catch(() => {
        setBackendMessage("Backend is not connected");
        setStatus("offline");
      });
  }, []);

  useEffect(() => {
    api
      .get("/emails")
      .then((response) => {
        setEmails(Array.isArray(response.data) ? response.data : []);
        setEmailsError("");
      })
      .catch(() => {
        setEmailsError("Unable to load your emails right now.");
      })
      .finally(() => setEmailsLoading(false));
  }, []);

  const stats = useMemo(() => {
    const unreadCount = emails.filter((email) => email.unread).length;

    const priorityCounts = PRIORITY_ORDER.reduce((acc, level) => {
      acc[level] = emails.filter((email) => email.priority === level).length;
      return acc;
    }, {});

    const recentEmails = [...emails]
      .sort(
        (a, b) =>
          new Date(b.receivedAt || b.createdAt || 0) -
          new Date(a.receivedAt || a.createdAt || 0)
      )
      .slice(0, 5);

    const taskEntries = emails.flatMap((email) =>
      (email.aiTasks || []).map((task) => ({ ...task, email }))
    );

    const upcomingDeadlines = taskEntries
      .filter((task) => task.deadline)
      .slice(0, 5);

    const summaries = emails
      .filter((email) => email.aiSummary && email.aiSummaryAt)
      .sort((a, b) => new Date(b.aiSummaryAt) - new Date(a.aiSummaryAt))
      .slice(0, 3);

    const replies = emails
      .filter((email) => email.aiReply && email.aiReplyAt)
      .sort((a, b) => new Date(b.aiReplyAt) - new Date(a.aiReplyAt))
      .slice(0, 3);

    const aiActivity = [
      ...summaries.map((email) => ({
        type: "summary",
        email,
        at: email.aiSummaryAt,
        text: email.aiSummary,
      })),
      ...replies.map((email) => ({
        type: "reply",
        email,
        at: email.aiReplyAt,
        text: email.aiReply,
      })),
    ]
      .sort((a, b) => new Date(b.at) - new Date(a.at))
      .slice(0, 5);

    const domainCounts = emails.reduce((acc, email) => {
      const domain = senderDomain(email);
      acc[domain] = (acc[domain] || 0) + 1;
      return acc;
    }, {});

    const categories = Object.entries(domainCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);

    const today = new Date();
    const weeklyActivity = Array.from({ length: 7 }).map((_, index) => {
      const day = new Date(today);
      day.setDate(today.getDate() - (6 - index));
      const dayKey = day.toDateString();

      const count = emails.filter((email) => {
        const receivedAt = email.receivedAt || email.createdAt;
        if (!receivedAt) return false;
        return new Date(receivedAt).toDateString() === dayKey;
      }).length;

      return {
        label: day.toLocaleDateString(undefined, { weekday: "short" }),
        count,
      };
    });

    const maxWeeklyCount = Math.max(1, ...weeklyActivity.map((d) => d.count));

    return {
      total: emails.length,
      unreadCount,
      priorityCounts,
      recentEmails,
      taskEntries,
      pendingTaskCount: taskEntries.length,
      upcomingDeadlines,
      aiActivity,
      categories,
      weeklyActivity,
      maxWeeklyCount,
    };
  }, [emails]);

  return (
    <div className="page-shell">
      <motion.div
        className="page-header"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      >
        <div>
          <span className="eyebrow">{greeting()}</span>
          <h1>{currentUser?.name || currentUser?.email || "Welcome back"}</h1>
          <p>Here&apos;s the state of your workspace.</p>
        </div>
        <Link to="/inbox" className="refresh-button">
          Open Inbox
          <ArrowUpRight size={15} strokeWidth={2.25} />
        </Link>
      </motion.div>

      <motion.div
        className="dashboard-grid"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="dashboard-card">
          <div className="dashboard-card-icon">
            {status === "online" ? (
              <Wifi size={18} strokeWidth={2.25} />
            ) : (
              <WifiOff size={18} strokeWidth={2.25} />
            )}
          </div>
          <div>
            <span className={`status-dot-label status-dot-label--${status}`}>
              {status === "online"
                ? "System online"
                : status === "offline"
                ? "System offline"
                : "Checking"}
            </span>
            <p className="dashboard-card-copy">{backendMessage}</p>
          </div>
        </div>

        <Link to="/inbox" className="dashboard-card dashboard-card--action">
          <div className="dashboard-card-icon">
            <InboxIcon size={18} strokeWidth={2.25} />
          </div>
          <div>
            <span className="dashboard-card-title">Go to inbox</span>
            <p className="dashboard-card-copy">
              Review new messages and run AI summaries, replies, and task
              extraction.
            </p>
          </div>
        </Link>

        <Link to="/settings" className="dashboard-card dashboard-card--action">
          <div className="dashboard-card-icon">
            <Plug size={18} strokeWidth={2.25} />
          </div>
          <div>
            <span className="dashboard-card-title">Connect Gmail</span>
            <p className="dashboard-card-copy">
              Sync recent messages into MailMind from your Gmail account.
            </p>
          </div>
        </Link>
      </motion.div>

      {emailsError && <ErrorMessage title="Couldn't load workspace data" message={emailsError} />}

      {emailsLoading ? (
        <LoadingSpinner label="Loading your workspace..." />
      ) : (
        <>
          <div className="stat-grid">
            <div className="stat-card">
              <MailOpen size={16} strokeWidth={2.25} />
              <span className="stat-value">{stats.unreadCount}</span>
              <span className="stat-label">Unread</span>
            </div>
            <div className="stat-card">
              <Sparkles size={16} strokeWidth={2.25} />
              <span className="stat-value">{stats.priorityCounts.High || 0}</span>
              <span className="stat-label">High priority</span>
            </div>
            <div className="stat-card">
              <CheckSquare size={16} strokeWidth={2.25} />
              <span className="stat-value">{stats.pendingTaskCount}</span>
              <span className="stat-label">Extracted tasks</span>
            </div>
            <div className="stat-card">
              <Mail size={16} strokeWidth={2.25} />
              <span className="stat-value">{stats.total}</span>
              <span className="stat-label">Total emails</span>
            </div>
          </div>

          <div className="dashboard-section-grid">
            <section className="dashboard-section">
              <div className="section-header">
                <h2>Recent emails</h2>
                <Link to="/inbox">View all</Link>
              </div>

              {stats.recentEmails.length === 0 ? (
                <p className="empty-state-block">
                  No emails yet. Connect Gmail or add an email to get started.
                </p>
              ) : (
                <div className="dashboard-email-list">
                  {stats.recentEmails.map((email) => (
                    <EmailCard key={email._id} email={email} />
                  ))}
                </div>
              )}
            </section>

            <section className="dashboard-section">
              <div className="section-header">
                <h2>Priority</h2>
              </div>

              {stats.total === 0 ? (
                <p className="empty-state-block">No emails to prioritize yet.</p>
              ) : (
                <div className="priority-breakdown">
                  {PRIORITY_ORDER.map((level) => {
                    const count = stats.priorityCounts[level] || 0;
                    const percent = stats.total
                      ? Math.round((count / stats.total) * 100)
                      : 0;
                    return (
                      <div className="priority-row" key={level}>
                        <span className={`priority priority--${level.toLowerCase()}`}>
                          {level}
                        </span>
                        <div className="priority-bar-track">
                          <div
                            className={`priority-bar-fill priority-bar-fill--${level.toLowerCase()}`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <span className="priority-count">{count}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="dashboard-section">
              <div className="section-header">
                <h2>Upcoming deadlines</h2>
              </div>

              {stats.upcomingDeadlines.length === 0 ? (
                <p className="empty-state-block">
                  No deadlines found. Extract tasks from an email to see them
                  here.
                </p>
              ) : (
                <div className="deadline-list">
                  {stats.upcomingDeadlines.map((task, index) => (
                    <Link
                      to={`/emails/${task.email._id}`}
                      className="deadline-item"
                      key={`${task.title}-${index}`}
                    >
                      <CalendarClock size={14} strokeWidth={2.25} />
                      <div>
                        <span className="deadline-title">{task.title}</span>
                        <span className="deadline-meta">{task.deadline}</span>
                      </div>
                      <span
                        className={`task-priority priority-${(
                          task.priority || "medium"
                        ).toLowerCase()}`}
                      >
                        {task.priority}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            <section className="dashboard-section">
              <div className="section-header">
                <h2>AI activity</h2>
              </div>

              {stats.aiActivity.length === 0 ? (
                <p className="empty-state-block">
                  Run a summary or generate a reply from any email to see your
                  recent AI activity here.
                </p>
              ) : (
                <div className="activity-list">
                  {stats.aiActivity.map((item, index) => (
                    <Link
                      to={`/emails/${item.email._id}`}
                      className="activity-item"
                      key={`${item.type}-${item.email._id}-${index}`}
                    >
                      <span className="activity-icon">
                        {item.type === "summary" ? (
                          <Sparkles size={13} strokeWidth={2.25} />
                        ) : (
                          <Mail size={13} strokeWidth={2.25} />
                        )}
                      </span>
                      <div className="activity-body">
                        <span className="activity-title">
                          {item.type === "summary" ? "Summarized" : "Replied to"}{" "}
                          &ldquo;{item.email.subject}&rdquo;
                        </span>
                        <span className="activity-snippet">{item.text}</span>
                      </div>
                      <span className="activity-date">
                        {formatRelativeDate(item.at)}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            <section className="dashboard-section">
              <div className="section-header">
                <h2>Categories</h2>
              </div>

              {stats.categories.length === 0 ? (
                <p className="empty-state-block">
                  Categories will appear here once you have emails from
                  different senders.
                </p>
              ) : (
                <div className="category-chip-list">
                  {stats.categories.map(([domain, count]) => (
                    <span className="category-chip" key={domain}>
                      {domain}
                      <span className="category-chip-count">{count}</span>
                    </span>
                  ))}
                </div>
              )}
            </section>

            <section className="dashboard-section">
              <div className="section-header">
                <h2>Weekly activity</h2>
              </div>

              {stats.total === 0 ? (
                <p className="empty-state-block">
                  No activity yet this week.
                </p>
              ) : (
                <div className="weekly-chart">
                  {stats.weeklyActivity.map((day) => (
                    <div className="weekly-chart-column" key={day.label}>
                      <div className="weekly-chart-track">
                        <div
                          className="weekly-chart-bar"
                          style={{
                            height: `${(day.count / stats.maxWeeklyCount) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="weekly-chart-label">{day.label}</span>
                      <span className="weekly-chart-count">{day.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  );
}

export default Dashboard;
