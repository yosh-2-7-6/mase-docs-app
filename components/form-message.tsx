export type Message =
  | { success: string }
  | { error: string }
  | { message: string };

export function FormMessage({ message }: { message: Message }) {
  return (
    <div className="flex flex-col gap-2 w-full text-sm">
      {"success" in message && (
        <div className="bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800 rounded-md px-4 py-3">
          {message.success}
        </div>
      )}
      {"error" in message && (
        <div className="bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-md px-4 py-3">
          {message.error}
        </div>
      )}
      {"message" in message && (
        <div className="bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-md px-4 py-3">
          {message.message}
        </div>
      )}
    </div>
  );
}
