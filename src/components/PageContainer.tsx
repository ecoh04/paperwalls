type PageContainerProps = {
  children: React.ReactNode;
  className?: string;
};

export function PageContainer({ children, className = "" }: PageContainerProps) {
  return (
    <div className={`mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8 ${className}`}>
      {children}
    </div>
  );
}
