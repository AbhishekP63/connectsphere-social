export function PostSkeleton() {
  return (
    <div className="card p-4 animate-pulse">
      <div className="flex items-start space-x-3">
        <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/3" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mt-2" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg mt-2" />
          <div className="flex space-x-6 mt-2">
            <div className="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}