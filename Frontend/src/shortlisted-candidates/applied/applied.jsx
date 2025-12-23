import React, { useEffect, useState } from "react";

function Applied() {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const colorId = 3; // Applied = color_id 3
  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_URL}/formDetials/color/${colorId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const result = await response.json();
        if (result.success) {
          setData(result.data || []);
          setTotal(result.total || 0);
        } else {
          setError(result.message || "Failed to load data");
        }
      } catch (err) {
        setError("Network error. Please try again.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [colorId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-indigo-600 font-medium text-lg">Loading Applied Applications...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-600 font-semibold text-center text-lg">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center sm:text-left">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
            Applied Applications
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Total Applications Received:{" "}
            <span className="text-green-600 font-bold text-xl">{total}</span>
          </p>
        </div>

        {/* Table / Cards Container */}
        <div className="bg-white shadow-xl rounded-xl overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-green-600 to-emerald-700 text-white">
                <tr>
                  {[
                    "ID",
                    "Name",
                    "Email",
                    "Phone",
                    "Type",
                    "Status",
                    "Department",
                    "Designation",
                    "Resume",
                    "Comments",
                  ].map((head) => (
                    <th
                      key={head}
                      className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider"
                    >
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-green-50 transition duration-150"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {item.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {item.number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {item.application_type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 inline-flex text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        {item.status || "Applied"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {item.department_name || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {item.designation || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {item.resume ? (
                        <a
                          href={`${API_URL}/uploads/${item.resume}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-600 hover:text-green-800 font-medium underline transition"
                        >
                          View Resume
                        </a>
                      ) : (
                        <span className="text-gray-400">No File</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs">
                      {item.comments ? (
                        <span title={item.comments}>
                          {item.comments.length > 40
                            ? item.comments.slice(0, 40) + "..."
                            : item.comments}
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden">
            {data.map((item) => (
              <div
                key={item.id}
                className="border-b border-gray-200 p-5 hover:bg-gray-50 transition"
              >
                <div className="flex justify-between items-center mb-3">
                  <div className="text-lg font-bold text-gray-900">
                    {item.name}
                  </div>
                  <span className="px-3 py-1 text-xs font-bold rounded-full bg-green-100 text-green-800">
                    Applied
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="font-medium text-gray-500">Email:</span>
                    <p className="text-gray-900 truncate">{item.email}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-500">Phone:</span>
                    <p className="text-gray-900">{item.number}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-500">Type:</span>
                    <p className="text-gray-900">{item.application_type}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-500">Dept:</span>
                    <p className="text-gray-900">
                      {item.department_name || "-"}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-4">
                  {item.resume && (
                    <a
                      href={`${API_URL}/uploads/${item.resume}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-600 font-medium underline text-sm"
                    >
                      View Resume
                    </a>
                  )}
                  {item.comments && (
                    <p className="text-xs text-gray-600">
                      <span className="font-medium">Note:</span>{" "}
                      {item.comments.length > 60
                        ? item.comments.slice(0, 60) + "..."
                        : item.comments}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Empty State */}
        {data.length === 0 && !loading && (
          <div className="text-center py-16">
            <p className="text-gray-500 text-lg">
              No applications found in "Applied" stage.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Applied;