export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="h-14 bg-gray-200 rounded-xl animate-pulse mb-4" />
      <div className="h-12 bg-gray-200 rounded-xl animate-pulse mb-4" />
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-36 bg-gray-200 rounded-xl animate-pulse" />
        ))}
      </div>
    </div>
  )
}
