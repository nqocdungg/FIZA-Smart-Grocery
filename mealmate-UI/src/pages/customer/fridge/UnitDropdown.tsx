import React, { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import "./UnitDropdown.css";

type UnitDropdownProps = {
  value: string;
  options: string[];
  onChange: (value: string) => void;
  disabled?: boolean;
  compact?: boolean;
  placement?: "top" | "bottom";
};

const UnitDropdown: React.FC<UnitDropdownProps> = ({
  value,
  options,
  onChange,
  disabled = false,
  compact = false,
  placement = "bottom",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  return (
    <div
      className={`unit-dropdown ${compact ? "compact" : ""} ${placement === "top" ? "open-up" : ""} ${isOpen ? "open" : ""}`}
      ref={rootRef}
    >
      <button
        type="button"
        className="unit-dropdown-trigger"
        onClick={() => setIsOpen((current) => !current)}
        disabled={disabled || options.length === 0}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span>{value}</span>
        <ChevronDown size={16} aria-hidden="true" />
      </button>

      {isOpen && (
        <div className="unit-dropdown-menu" role="listbox" aria-label="Đơn vị">
          {options.map((option) => {
            const isSelected = option === value;

            return (
              <button
                type="button"
                role="option"
                aria-selected={isSelected}
                className={isSelected ? "selected" : ""}
                key={option}
                onClick={() => {
                  onChange(option);
                  setIsOpen(false);
                }}
              >
                <span>{option}</span>
                {isSelected && <Check size={15} aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default UnitDropdown;
