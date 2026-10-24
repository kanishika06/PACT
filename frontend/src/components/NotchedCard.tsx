import { motion, type HTMLMotionProps } from "framer-motion";
import type { ReactNode } from "react";

/**
 * The signature card from the reference: rounded rect with two opposite
 * corners cut. clip-path removes any CSS border, so the gradient hairline is
 * a 1px padded wrapper with the panel colour inside.
 */

interface Props extends Omit<HTMLMotionProps<"div">, "children"> {
  children: ReactNode;
  /** Filled with the accent gradient instead of outlined. */
  active?: boolean;
  /** Hover lift + border brighten. */
  interactive?: boolean;
  small?: boolean;
  innerClassName?: string;
}

export default function NotchedCard({
  children,
  active = false,
  interactive = false,
  small = false,
  className = "",
  innerClassName = "",
  ...rest
}: Props) {
  const notch = small ? "notched-sm" : "notched";

  return (
    <motion.div
      {...rest}
      className={`${notch} p-px transition-[opacity,filter] duration-300 ${
        active ? "opacity-100" : "opacity-40"
      } ${interactive ? "cursor-pointer hover:opacity-100" : ""} ${className}`}
      style={{ background: "var(--grad)", ...(rest.style ?? {}) }}
      whileHover={interactive ? { scale: 1.02, y: -4 } : undefined}
      whileTap={interactive ? { scale: 0.99 } : undefined}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
    >
      <div
        className={`${notch} w-full ${innerClassName}`}
        style={{
          background: active
            ? "linear-gradient(135deg, rgba(45,212,212,0.92), rgba(124,58,237,0.92) 60%, rgba(192,38,211,0.9))"
            : "var(--panel)",
        }}
      >
        {children}
      </div>
    </motion.div>
  );
}
