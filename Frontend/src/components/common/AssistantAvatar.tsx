import avatar from "../../assets/images/avatar.png";

type Props = {
  size?: 32 | 48 | 64;
  className?: string;
};

const sizeClasses = {
  32: "h-8 w-8",
  48: "h-12 w-12",
  64: "h-16 w-16",
};

export default function AssistantAvatar({ size = 48, className = "" }: Props) {
  return (
    <img
      src={avatar}
      alt="GlobeGuide AI"
      className={`${sizeClasses[size]} shrink-0 rounded-full border-2 border-white object-cover shadow-[0_6px_18px_rgba(0,0,0,0.15)] ${className}`}
    />
  );
}
