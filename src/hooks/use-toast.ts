import { useCallback, useState } from "react"

export function useToast() {
  const [toasts, setToasts] = useState<{
    id: string
    title: string
    description: string
    variant?: "default" | "destructive"
  }[]>([])

  const toast = useCallback(
    ({
      title,
      description,
      variant = "default",
    }: {
      title: string
      description: string
      variant?: "default" | "destructive"
    }) => {
      const id = Math.random().toString(36).substr(2, 9)
      setToasts((prev) => [...prev, { id, title, description, variant }])
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, 5000)
    },
    []
  )

  return { toast, toasts }
}