import {
  BookOpen,
  ClipboardList,
  Code2,
  FileText,
  GitBranch,
  HardDrive,
  Kanban,
  Link2,
  PenTool,
  Video,
} from "lucide-react";

const ICONS = {
  meeting: Video,
  form: ClipboardList,
  doc: FileText,
  drive: HardDrive,
  github: GitBranch,
  notion: BookOpen,
  figma: PenTool,
  jira: Kanban,
  trello: Kanban,
  code: Code2,
  generic: Link2,
};

function SmartLinks({ links }) {
  if (!links || links.length === 0) {
    return null;
  }

  return (
    <div className="result-card smart-links-card signal-card">
      <div className="result-card-header">
        <span className="result-icon">
          <Link2 size={14} strokeWidth={2.25} />
        </span>
        <h4>Detected Links</h4>
      </div>

      <div className="smart-links-grid">
        {links.map((link) => {
          const Icon = ICONS[link.kind] || Link2;

          return (
            <a
              key={link.url}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="smart-link-button"
            >
              <span className="smart-link-icon">
                <Icon size={15} strokeWidth={2.25} />
              </span>
              <span className="smart-link-text">
                <span className="smart-link-label">{link.label}</span>
                <span className="smart-link-provider">{link.provider}</span>
              </span>
            </a>
          );
        })}
      </div>
    </div>
  );
}

export default SmartLinks;
