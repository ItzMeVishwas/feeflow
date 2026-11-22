import type React from "react";

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-heading text-[32px] font-extrabold leading-tight tracking-tight text-[#0F1E3C] dark:text-[#E6ECF5]">
          {title}
        </h1>
        <p className="mt-1 text-sm text-[#5B6B84] dark:text-[#93A3BC]">
          {description}
        </p>
      </div>
      {action}
    </div>
  );
}
