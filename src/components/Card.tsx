import type { PropsWithChildren } from 'react'

type CardProps = PropsWithChildren<{
  className?: string
}>

export default function Card({ className, children }: CardProps) {
  return (
    <div className={["card", className ?? ''].filter(Boolean).join(' ')}>
      {children}
    </div>
  )
}
