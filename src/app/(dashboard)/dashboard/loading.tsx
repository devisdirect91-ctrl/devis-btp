export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="h-16 bg-gray-200 rounded-xl animate-pulse mb-4" />
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="h-20 bg-gray-200 rounded-xl animate-pulse" />
        <div className="h-20 bg-gray-200 rounded-xl animate-pulse" />
        <div className="h-20 bg-gray-200 rounded-xl animate-pulse" />
      </div>
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-gray-200 rounded-xl animate-pulse" />
        ))}
      </div>
    </div>
  )
}
