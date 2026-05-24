import { useParams, Link } from 'react-router-dom';
import { useBom } from '../hooks/queries';

function BomView() {
  const { projectName } = useParams<{ projectName: string }>();
  const { data: bom, isLoading, error } = useBom(projectName);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-600">Loading bill of materials...</div>
      </div>
    );
  }

  if (error || !bom) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error?.message || 'Bill of materials not found'}
        </div>
        <Link
          to={`/projects/${encodeURIComponent(projectName || '')}`}
          className="text-blue-600 hover:underline mt-4 inline-block"
        >
          ← Back to project
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Link
          to={`/projects/${encodeURIComponent(projectName || '')}`}
          className="text-blue-600 hover:underline"
        >
          ← Back to project
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow border border-gray-200 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Bill of Materials</h1>
          <p className="text-lg text-gray-600 mb-1">{bom.projectName}</p>
          <p className="text-sm text-gray-500">{bom.description}</p>
          <p className="text-sm text-gray-500">Generated: {bom.generatedDate}</p>
        </div>

        {bom.categories.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No items in this project yet.
          </div>
        ) : (
          <>
            {bom.categories.map((categorySection) => (
              <div key={categorySection.category} className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 uppercase tracking-wide border-b-2 border-gray-300 pb-2">
                  {categorySection.category}
                </h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                          Item
                        </th>
                        <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">
                          Quantity
                        </th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                          Unit
                        </th>
                        <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">
                          Unit Cost
                        </th>
                        <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {categorySection.lineItems.map((item) => (
                        <tr key={item.id} className="border-b border-gray-100">
                          <td className="px-4 py-3 text-sm text-gray-900">{item.name}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-right">
                            {item.quantity}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{item.unit}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-right">
                            ${item.unitCost.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                            ${item.totalCost.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-gray-50 font-semibold">
                        <td colSpan={4} className="px-4 py-3 text-sm text-gray-900 text-right">
                          {categorySection.category} Subtotal:
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right">
                          ${categorySection.subtotal.toFixed(2)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            ))}

            <div className="mt-8 pt-6 border-t-4 border-gray-300">
              <div className="flex justify-end">
                <div className="text-right">
                  <p className="text-sm text-gray-600 mb-1">GRAND TOTAL</p>
                  <p className="text-3xl font-bold text-gray-900">
                    ${bom.grandTotal.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default BomView;
