import { getAvatarColors, getInitials } from "../utils/avatar";

function Avatar({ name, size = 40 }) {
  const { bg, fg } = getAvatarColors(name);

  return (
    <span
      className="avatar"
      style={{
        width: size,
        height: size,
        fontSize: Math.max(11, size * 0.36),
        background: bg,
        color: fg,
      }}
      aria-hidden="true"
    >
      {getInitials(name)}
    </span>
  );
}

export default Avatar;
