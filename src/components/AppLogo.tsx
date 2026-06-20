interface Props {
  size?: number;
  className?: string;
}
const AppLogo = ({ size = 40, className = "" }: Props) => (
  <img
    src="/app-icon.png"
    alt="TIME FARMER"
    width={size}
    height={size}
    className={`rounded-xl object-cover shadow-md ${className}`}
    style={{ width: size, height: size }}
  />
);
export default AppLogo;
