import "./Input.css";

export default function Input({
    icon,
    rightIcon,
    type = "text",
    placeholder = "",
    value,
    onChange,
    onKeyDown,
    ...rest
}) {
    return (
        <div className="rumo-input-wrapper">

            {icon && (
                <div className="rumo-input-icon">
                    {icon}
                </div>
            )}

            <input
                className="rumo-input"
                type={type}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                onKeyDown={onKeyDown}
                {...rest}
            />

            {rightIcon && (
                <div className="rumo-input-right-icon">
                    {rightIcon}
                </div>
            )}

        </div>
    );
}