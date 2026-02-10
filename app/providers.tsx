"use client"

import { ConfirmDialogProvider } from "@/context/ConfirmDialogContext"
import { DataProvider } from "@/context/DataContext"
import { ModalOpenProvider } from "@/context/ModalContext"
import { SettingsProvider, useSettings } from "@/context/SettingsContext"
import { ThemeProvider } from "@/context/ThemeContext"
import { useAutoBackup } from "@/hook/useAutoBackup"
import { ReactNode, useEffect, createContext, useContext } from "react"
import { MotionConfig } from "framer-motion"
import { ToastProvider } from "@/context/ToastContext"

const AnimationContext = createContext<boolean>(true)

export function useAnimationsEnabled() {
  return useContext(AnimationContext)
}

function MotionWrapper({ children }: { children: ReactNode }) {
  const { settings } = useSettings()
  const animationsEnabled = settings.showAnimations

  useEffect(() => {
    if (animationsEnabled) {
      document.documentElement.classList.remove("disable-animations")
    } else {
      document.documentElement.classList.add("disable-animations")
    }
  }, [animationsEnabled])

  return (
    <AnimationContext.Provider value={animationsEnabled}>
      <MotionConfig
        transition={animationsEnabled ? undefined : { duration: 0 }}
        reducedMotion={animationsEnabled ? "never" : "always"}
      >
        {children}
      </MotionConfig>
    </AnimationContext.Provider>
  )
}

function AutoBackupManager({ children }: { children: ReactNode }) {
  useAutoBackup()
  return <>{children}</>
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SettingsProvider>
      <MotionWrapper>
        <ThemeProvider>
          <ToastProvider>
            <ModalOpenProvider>
              <ConfirmDialogProvider>
                <DataProvider>
                  <AutoBackupManager>{children}</AutoBackupManager>
                </DataProvider>
              </ConfirmDialogProvider>
            </ModalOpenProvider>
          </ToastProvider>
        </ThemeProvider>
      </MotionWrapper>
    </SettingsProvider>
  )
}
