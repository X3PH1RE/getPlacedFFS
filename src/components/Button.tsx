type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'solid' | 'ghost'
}

export default function Button({ variant = 'solid', className, ...props }: ButtonProps) {
  const classes = [
    'btn',
    variant === 'ghost' ? 'btn-ghost' : '',
    className ?? '',
  ].filter(Boolean).join(' ')

  return <button className={classes} {...props} />
}
