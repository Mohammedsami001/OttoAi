import { motion } from "motion/react";

import { useTheme } from "next-themes";

export function LightPullThemeSwitcher() {
    const { theme, setTheme } = useTheme();
    const toggleDarkMode = () => {
        setTheme(theme === "dark" ? "light" : "dark");
    };

    return (
      <div 
        className="relative h-[250px] w-[80px] flex justify-center items-end pb-8"
        style={{ clipPath: "inset(0 -100px -100px -100px)" }}
      >
        <motion.div
          drag="y"
          dragDirectionLock
          onDragEnd={(event, info) => {
            if (info.offset.y > 0) {
              toggleDarkMode();
            }
          }}
          dragConstraints={{ top: 0, right: 0, bottom: 0, left: 0 }}
          dragTransition={{ bounceStiffness: 500, bounceDamping: 15 }}
          dragElastic={0.075}
          whileDrag={{ cursor: "grabbing" }}
          className="relative w-8 h-8 rounded-full z-10 cursor-grab
               bg-[radial-gradient(circle_at_center,_#4b5563,_#1f2937,_#000)] 
               dark:bg-[radial-gradient(circle_at_center,_#facc15,_#fcd34d,_#fef9c3)] 
               shadow-[0_0_20px_6px_rgba(31,41,55,0.4)] 
               dark:shadow-[0_0_20px_8px_rgba(250,204,21,0.5)]"
        >
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-0.5 h-[9999px] bg-neutral-300 dark:bg-neutral-600"></div>
        </motion.div>
      </div>
    );
}
