import { Download, Eye, File, FileArchive, FileSpreadsheet, FileText, Film, Image, Paperclip } from "lucide-react";

const ICONS = {
  pdf: FileText,
  doc: FileText,
  ppt: FileText,
  sheet: FileSpreadsheet,
  archive: FileArchive,
  image: Image,
  video: Film,
  file: File,
};

const EMOJI = {
  pdf: "📄",
  doc: "📝",
  ppt: "📊",
  sheet: "📈",
  archive: "📦",
  image: "🖼",
  video: "🎬",
  file: "📎",
};

function AttachmentList({ attachments }) {
  if (!attachments || attachments.length === 0) {
    return null;
  }

  return (
    <div className="result-card attachment-card signal-card">
      <div className="result-card-header">
        <span className="result-icon">
          <Paperclip size={14} strokeWidth={2.25} />
        </span>
        <h4>Attachments Mentioned</h4>
      </div>

      <div className="attachment-list">
        {attachments.map((attachment) => {
          const Icon = ICONS[attachment.kind] || File;

          return (
            <div className="attachment-row" key={attachment.name}>
              <span className="attachment-emoji" aria-hidden="true">
                {EMOJI[attachment.kind] || "📎"}
              </span>

              <span className="attachment-name">
                <Icon size={13} strokeWidth={2.25} />
                {attachment.name}
              </span>

              {attachment.url ? (
                <a
                  href={attachment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="attachment-action"
                >
                  {attachment.kind === "image" ? (
                    <>
                      <Eye size={13} strokeWidth={2.25} />
                      Preview
                    </>
                  ) : (
                    <>
                      <Download size={13} strokeWidth={2.25} />
                      Download
                    </>
                  )}
                </a>
              ) : (
                <span className="attachment-mentioned-only">Mentioned in email</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default AttachmentList;
