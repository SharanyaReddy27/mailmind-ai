import {
  AlertTriangle,
  CalendarClock,
  Clock,
  CreditCard,
  FileText,
  Link2,
  MessageSquareWarning,
  Paperclip,
  Phone,
  Video,
} from "lucide-react";

function InsightChip({ icon: Icon, label, active }) {
  return (
    <span className={`insight-chip ${active ? "insight-chip--active" : "insight-chip--inactive"}`}>
      <Icon size={13} strokeWidth={2.25} />
      {label}
      <span className="insight-chip-value">{active ? "Yes" : "No"}</span>
    </span>
  );
}

function EmailInsights({ insights, deadlines }) {
  if (!insights) {
    return null;
  }

  const urgencyTone =
    insights.urgency === "High" ? "high" : insights.urgency === "Medium" ? "medium" : "low";

  return (
    <div className="result-card insights-card signal-card">
      <div className="result-card-header">
        <span className="result-icon">
          <Clock size={14} strokeWidth={2.25} />
        </span>
        <h4>Email Insights</h4>
      </div>

      <div className="insight-headline-row">
        <div className="insight-headline">
          <span className="insight-headline-label">Reading time</span>
          <span className="insight-headline-value">
            {insights.readingTimeMinutes} min{insights.readingTimeMinutes === 1 ? "" : "s"}
          </span>
        </div>

        <div className="insight-headline">
          <span className="insight-headline-label">Urgency</span>
          <span className={`insight-urgency insight-urgency--${urgencyTone}`}>
            {insights.urgency}
          </span>
        </div>

        <div className="insight-headline">
          <span className="insight-headline-label">Requires reply</span>
          <span className="insight-headline-value">
            {insights.requiresReply ? "Yes" : "No"}
          </span>
        </div>
      </div>

      <div className="insight-chip-grid">
        <InsightChip icon={CalendarClock} label="Deadline" active={insights.containsDeadline} />
        <InsightChip icon={Paperclip} label="Attachment" active={insights.containsAttachment} />
        <InsightChip icon={Video} label="Meeting" active={insights.containsMeeting} />
        <InsightChip icon={CreditCard} label="Payment" active={insights.containsPayment} />
        <InsightChip icon={FileText} label="Form" active={insights.containsForm} />
        <InsightChip icon={Link2} label="External link" active={insights.containsExternalLink} />
        <InsightChip icon={Phone} label="Contact info" active={insights.containsContactInfo} />
      </div>

      {deadlines && deadlines.length > 0 && (
        <div className="insight-deadlines">
          <span className="insight-deadlines-title">
            <AlertTriangle size={12} strokeWidth={2.25} />
            Detected deadlines
          </span>
          <ul>
            {deadlines.map((deadline, index) => (
              <li key={`${deadline.raw}-${index}`}>
                <MessageSquareWarning size={12} strokeWidth={2.25} />
                <span>
                  <strong>{deadline.raw}</strong> → {deadline.label}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default EmailInsights;
