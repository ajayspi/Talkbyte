import React from 'react';

export const metadata = {
  title: 'Authentication — TalkByte AI',
  description: 'Sign in or register for TalkByte AI restaurant voice ordering platform',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f8f7ff] text-[#111827] flex flex-col justify-center items-center p-4 selection:bg-[#7c3aed] selection:text-white">
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  );
}
