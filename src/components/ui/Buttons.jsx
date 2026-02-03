import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

export const Button = ({ className, variant = "primary", size = "md", children, ...props }) => {
  const variants = {
    primary: "bg-primary text-white shadow-lg shadow-primary/30 hover:shadow-primary/50",
    secondary: "bg-secondary text-white shadow-lg shadow-secondary/30",
    danger: "bg-danger/10 text-danger hover:bg-danger hover:text-white",
    outline: "border-2 border-primary text-primary bg-transparent",
    ghost: "bg-transparent text-text-muted hover:bg-gray-100 hover:text-text-main",
    soft: "bg-primary-soft text-primary font-bold",
  }
  
  const sizes = {
    sm: "h-9 px-3 text-xs rounded-xl",
    md: "h-12 px-5 text-sm rounded-2xl", // Tinggi ideal mobile (48px)
    lg: "h-14 px-8 text-base rounded-[20px]", // Tombol utama (56px)
    icon: "h-12 w-12 rounded-2xl flex items-center justify-center p-0",
  }

  return (
    <motion.button 
      whileTap={{ scale: 0.95 }}
      className={cn(
        "inline-flex items-center justify-center font-bold tracking-wide transition-all disabled:opacity-50 disabled:pointer-events-none active:scale-95",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </motion.button>
  )
}