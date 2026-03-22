import React from 'react';
import styles from './Card.module.css';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
  noPadding?: boolean;
}

export function Card({ children, title, className, noPadding = false }: CardProps) {
  return (
    <div className={`${styles.card} ${noPadding ? styles.noPadding : ''} ${className ?? ''}`}>
      {title ? <h2 className={styles.title}>{title}</h2> : null}
      <div className={styles.body}>{children}</div>
    </div>
  );
}
