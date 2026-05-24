import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useProject, useDeleteProject, useAddLineItem, useDeleteLineItem } from '../hooks/queries';
import { VALID_CATEGORIES } from '../constants';
import type { CategoryName } from '../types';

function ProjectDetail() {
  const { projectName } = useParams<{ projectName: string }>();
  const navigate = useNavigate();
  const { data: project, isLoading, error } = useProject(projectName);
  const deleteMutation = useDeleteProject();
  const addItemMutation = useAddLineItem(projectName || '');
  const deleteItemMutation = useDeleteLineItem(projectName || '');

  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: '' as CategoryName,
    quantity: '',
    unit: '',
    unitCost: '',
    notes: '',
  });

  const handleDeleteProject = async () => {
    if (window.confirm(`Are you sure you want to delete "${projectName}"?`)) {
      try {
        await deleteMutation.mutateAsync(projectName!);
        navigate('/');
      } catch (err) {
        // Error is shown via mutation state
      }
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addItemMutation.mutateAsync({
        name: formData.name,
        category: formData.category,
        quantity: parseFloat(formData.quantity),
        unit: formData.unit,
        unitCost: parseFloat(formData.unitCost),
        notes: formData.notes || undefined,
      });
      setFormData({
        name: '',
        category: '' as CategoryName,
        quantity: '',
        unit: '',
        unitCost: '',
        notes: '',
      });
      setShowAddForm(false);
    } catch (err) {
      // Error is shown via mutation state
    }
  };

  const handleDeleteItem = async (itemId: string, itemName: string) => {
    if (window.confirm(`Delete "${itemName}"?`)) {
      try {
        await deleteItemMutation.mutateAsync(itemId);
      } catch (err) {
        // Error is shown via mutation state
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-600">Loading project...</div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error?.message || 'Project not found'}
        </div>
        <Link to="/" className="text-blue-600 hover:underline mt-4 inline-block">
          ← Back to projects
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Link to="/" className="text-blue-600 hover:underline">
          ← Back to projects
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow border border-gray-200 p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{project.name}</h1>
            <p className="text-gray-600">{project.description || 'No description'}</p>
          </div>
          <div className="flex gap-2">
            <Link
              to={`/projects/${encodeURIComponent(project.name)}/bom`}
              className="bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded-lg transition"
            >
              View BOM
            </Link>
            <button
              onClick={handleDeleteProject}
              disabled={deleteMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white font-medium px-4 py-2 rounded-lg transition disabled:opacity-50"
            >
              Delete Project
            </button>
          </div>
        </div>
      </div>

      {addItemMutation.error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {addItemMutation.error.message}
        </div>
      )}

      {deleteItemMutation.error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {deleteItemMutation.error.message}
        </div>
      )}

      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">Line Items</h2>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition"
          >
            {showAddForm ? 'Cancel' : 'Add Item'}
          </button>
        </div>

        {showAddForm && (
          <form onSubmit={handleAddItem} className="bg-gray-50 p-4 rounded-lg mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value as CategoryName })
                  }
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Select category</option>
                  {VALID_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit *</label>
                <input
                  type="text"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  required
                  placeholder="e.g., board, sheet, each"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unit Cost *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.unitCost}
                  onChange={(e) => setFormData({ ...formData, unitCost: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (optional)
                </label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={addItemMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-lg transition disabled:opacity-50"
            >
              {addItemMutation.isPending ? 'Adding...' : 'Add Item'}
            </button>
          </form>
        )}

        {project.lineItems.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No line items yet. Add one to get started!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Category
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Quantity
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Unit
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Unit Cost
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Total Cost
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Notes
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {project.lineItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">{item.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{item.category}</td>
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
                    <td className="px-4 py-3 text-sm text-gray-600">{item.notes || '—'}</td>
                    <td className="px-4 py-3 text-sm text-right">
                      <button
                        onClick={() => handleDeleteItem(item.id, item.name)}
                        disabled={deleteItemMutation.isPending}
                        className="text-red-600 hover:text-red-800 font-medium disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProjectDetail;
