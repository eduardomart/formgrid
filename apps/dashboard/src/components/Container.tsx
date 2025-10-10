import { ReactNode } from 'react'
import { clsx } from 'clsx'

interface ContainerProps {
    children: ReactNode
    size?: 'default' | 'sm' | 'xs'
    className?: string
}

export function Container({ children, size = 'default', className }: ContainerProps) {
    const sizeClasses = {
        default: 'container',
        sm: 'container-sm',
        xs: 'container-xs'
    }

    return (
        <div className={clsx(sizeClasses[size], className)}>
            {children}
        </div>
    )
}
