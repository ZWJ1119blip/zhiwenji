/** 印章风格小红章（新中式视觉符号） */
export default function Seal({ char = '织', size = 'md', className = '' }) {
  const sizes = {
    sm: 'h-7 w-7 text-sm',
    md: 'h-9 w-9 text-lg',
    lg: 'h-12 w-12 text-2xl',
  };
  return (
    <span
      className={`inline-grid shrink-0 place-items-center rounded-[5px] bg-zhusha font-serif font-semibold text-rice shadow-[inset_0_0_0_1px_rgba(246,241,230,0.55),inset_0_0_0_4px_rgba(178,58,46,0.92),inset_0_0_0_5px_rgba(246,241,230,0.35)] ${sizes[size]} ${className}`}
    >
      {char}
    </span>
  );
}
