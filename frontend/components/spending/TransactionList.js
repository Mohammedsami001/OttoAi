export default function TransactionList({ transactions }) {
  return (
    <div className="card p-6 overflow-auto">
      <table className="w-full text-sm min-w-[580px]">
        <thead>
          <tr className="text-left text-gray-600 border-b border-gray-200 font-semibold">
            <th className="py-3 px-3 first:pl-0">Date</th>
            <th className="py-3 px-3">Merchant</th>
            <th className="py-3 px-3">Category</th>
            <th className="py-3 px-3">Source</th>
            <th className="py-3 px-3 text-right last:pr-0">Amount</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => (
            <tr key={tx.transaction_id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
              <td className="py-3 px-3 first:pl-0 text-gray-600">{new Date(tx.date).toLocaleString()}</td>
              <td className="py-3 px-3 text-gray-900 font-medium">{tx.merchant}</td>
              <td className="py-3 px-3 text-gray-600 capitalize">{tx.category}</td>
              <td className="py-3 px-3 text-gray-600 uppercase text-xs font-medium">{tx.source}</td>
              <td className="py-3 px-3 last:pr-0 text-right font-semibold text-blue-600">INR {tx.amount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
