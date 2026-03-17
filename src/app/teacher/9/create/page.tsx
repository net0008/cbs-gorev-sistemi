'use client';
import dynamic from "next/dynamic";

const TaskCreator = dynamic(() => import('@/components/maps/TaskCreator'), { ssr: false });

export default function CreateTaskPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 border-b border-border pb-4">
        9. Sınıf İçerik Hazırlama Modülü
      </h1>
      <TaskCreator />
    </div>
  );
}