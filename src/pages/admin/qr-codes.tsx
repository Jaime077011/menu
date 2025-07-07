import { useState, useRef } from "react";
import { type GetServerSideProps } from "next";
import Head from "next/head";
import { getAdminSessionFromCookies, type AdminSession } from "@/utils/auth";
import { api } from "@/utils/api";
import AdminLayout from "@/components/AdminLayout";
import { useTheme } from "@/contexts/ThemeContext";

interface QRCodesPageProps {
  session: AdminSession;
}

export default function QRCodesPage({ session }: QRCodesPageProps) {
  const { actualTheme } = useTheme();
  const [selectedTable, setSelectedTable] = useState<number>(1);
  const [qrFormat, setQrFormat] = useState<"png" | "svg">("png");
  const [bulkStart, setBulkStart] = useState<number>(1);
  const [bulkEnd, setBulkEnd] = useState<number>(10);
  const [generatedQR, setGeneratedQR] = useState<any>(null);
  const [bulkQRs, setBulkQRs] = useState<any[]>([]);
  const downloadRef = useRef<HTMLAnchorElement>(null);

  // tRPC hooks
  const generateQRMutation = api.qr.generateTableQR.useMutation({
    onSuccess: (data) => {
      setGeneratedQR(data);
    },
    onError: (error) => {
      alert("Error generating QR code: " + error.message);
    },
  });

  const generateBulkMutation = api.qr.generateBulkQR.useMutation({
    onSuccess: (data) => {
      setBulkQRs(data.qrCodes);
    },
    onError: (error) => {
      alert("Error generating bulk QR codes: " + error.message);
    },
  });

  const tablesQuery = api.qr.getRestaurantTables.useQuery({
    maxTables: 50,
  });

  const handleGenerateQR = () => {
    generateQRMutation.mutate({
      tableNumber: selectedTable,
      format: qrFormat,
    });
  };

  const handleGenerateBulk = () => {
    if (bulkStart > bulkEnd) {
      alert("Start table must be less than or equal to end table");
      return;
    }
    if (bulkEnd - bulkStart > 50) {
      alert("Cannot generate more than 50 QR codes at once");
      return;
    }

    generateBulkMutation.mutate({
      startTable: bulkStart,
      endTable: bulkEnd,
      format: qrFormat,
    });
  };

  const downloadQR = (data: string, filename: string) => {
    if (qrFormat === "png") {
      // For PNG data URLs
      const link = document.createElement("a");
      link.href = data;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // For SVG data
      const blob = new Blob([data], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  const printQRCode = () => {
    if (!generatedQR) return;
    
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const content = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Code - Table ${generatedQR.tableNumber}</title>
          <style>
            body {
              margin: 0;
              padding: 20px;
              font-family: Arial, sans-serif;
              text-align: center;
            }
            .qr-container {
              display: inline-block;
              border: 2px solid #000;
              padding: 20px;
              border-radius: 10px;
            }
            .restaurant-name {
              font-size: 24px;
              font-weight: bold;
              margin-bottom: 10px;
            }
            .table-number {
              font-size: 18px;
              margin-bottom: 20px;
            }
            .qr-code {
              margin: 20px 0;
            }
            .instructions {
              font-size: 14px;
              color: #666;
              margin-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <div class="restaurant-name">${generatedQR.restaurantName}</div>
            <div class="table-number">Table ${generatedQR.tableNumber}</div>
            <div class="qr-code">
              ${qrFormat === "png" 
                ? `<img src="${generatedQR.data}" alt="QR Code" />` 
                : generatedQR.data
              }
            </div>
            <div class="instructions">
              Scan this QR code to order from your table
            </div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <>
      <Head>
        <title>QR Codes - {session.restaurantName}</title>
        <meta name="description" content="Generate and manage QR codes for restaurant tables" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style jsx global>{`
          * {
            scrollbar-width: thin !important;
            scrollbar-color: ${actualTheme === 'dark' ? '#f97316 #111827' : '#6b7280 #f3f4f6'} !important;
          }
          *::-webkit-scrollbar {
            width: 8px !important;
            height: 8px !important;
          }
          *::-webkit-scrollbar-track {
            background: ${actualTheme === 'dark' ? '#111827' : '#f3f4f6'} !important;
            border-radius: 4px !important;
          }
          *::-webkit-scrollbar-thumb {
            background: ${actualTheme === 'dark' ? 'linear-gradient(45deg, #f97316, #eab308)' : 'linear-gradient(45deg, #9ca3af, #6b7280)'} !important;
            border-radius: 4px !important;
          }
          *::-webkit-scrollbar-thumb:hover {
            background: ${actualTheme === 'dark' ? 'linear-gradient(45deg, #ea580c, #ca8a04)' : 'linear-gradient(45deg, #6b7280, #4b5563)'} !important;
          }
          html, body {
            color-scheme: ${actualTheme === 'dark' ? 'dark' : 'light'} !important;
          }
        `}</style>
      </Head>

      <AdminLayout session={session} title="NEXUS QR Code Management">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-lg flex items-center justify-center">
              <span className="text-black font-bold text-sm font-mono">Q</span>
            </div>
            <div>
              <h2 className={`text-2xl font-mono font-bold bg-gradient-to-r bg-clip-text text-transparent ${
                actualTheme === 'dark' 
                  ? 'from-white to-cyan-200' 
                  : 'from-gray-800 to-gray-900'
              }`}>
                QR CODE MANAGEMENT
              </h2>
              <p className={`font-mono ${
                actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Generate QR codes for your restaurant tables that customers can scan to start ordering
              </p>
            </div>
          </div>

          {/* Restaurant Info */}
          <div className={`backdrop-blur-sm rounded-xl p-6 ${
            actualTheme === 'dark'
              ? 'bg-gray-900/50 border border-gray-800'
              : 'bg-white/50 border border-gray-200'
          }`}>
            <h3 className={`font-mono font-bold mb-4 flex items-center gap-2 ${
              actualTheme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              <span className="text-lg">🏪</span> RESTAURANT DETAILS
            </h3>
            <div className={`text-sm space-y-2 font-mono ${
              actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              <p><strong className={actualTheme === 'dark' ? 'text-white' : 'text-gray-900'}>NAME:</strong> {session.restaurantName}</p>
              <p><strong className={actualTheme === 'dark' ? 'text-white' : 'text-gray-900'}>CUSTOMER URL:</strong> <span className="text-cyan-500">localhost:3000/{tablesQuery.data?.subdomain}</span></p>
              <p><strong className={actualTheme === 'dark' ? 'text-white' : 'text-gray-900'}>TOTAL TABLES:</strong> <span className="text-green-500">{tablesQuery.data?.tables.length || 0}</span></p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Single QR Code Generator */}
            <div className={`backdrop-blur-sm rounded-xl p-6 ${
              actualTheme === 'dark'
                ? 'bg-gray-900/50 border border-gray-800'
                : 'bg-white/50 border border-gray-200'
            }`}>
              <h2 className={`text-xl font-mono font-bold mb-6 flex items-center gap-2 ${
                actualTheme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm rounded-full w-8 h-8 inline-flex items-center justify-center font-bold">1</span>
                SINGLE QR CODE
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label className={`block text-sm font-mono font-bold mb-3 ${
                    actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    TABLE NUMBER
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="999"
                    value={selectedTable}
                    onChange={(e) => setSelectedTable(Number(e.target.value))}
                    className={`w-full px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono ${
                      actualTheme === 'dark'
                        ? 'bg-gray-800/50 border border-gray-700 text-white'
                        : 'bg-gray-50/50 border border-gray-300 text-gray-900'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-mono font-bold mb-3 ${
                    actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    FORMAT
                  </label>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setQrFormat("png")}
                      className={`flex-1 py-3 px-4 rounded-lg font-mono font-bold transition-all ${
                        qrFormat === "png" 
                          ? 'bg-blue-500/20 text-blue-500 border border-blue-400/30' 
                          : actualTheme === 'dark'
                          ? 'bg-gray-800/50 border border-gray-700 text-gray-300 hover:bg-gray-700/50'
                          : 'bg-gray-50/50 border border-gray-300 text-gray-700 hover:bg-gray-100/50'
                      }`}
                    >
                      PNG
                    </button>
                    <button
                      onClick={() => setQrFormat("svg")}
                      className={`flex-1 py-3 px-4 rounded-lg font-mono font-bold transition-all ${
                        qrFormat === "svg" 
                          ? 'bg-blue-500/20 text-blue-500 border border-blue-400/30' 
                          : actualTheme === 'dark'
                          ? 'bg-gray-800/50 border border-gray-700 text-gray-300 hover:bg-gray-700/50'
                          : 'bg-gray-50/50 border border-gray-300 text-gray-700 hover:bg-gray-100/50'
                      }`}
                    >
                      SVG
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleGenerateQR}
                  disabled={generateQRMutation.isPending}
                  className="w-full bg-blue-500/20 text-blue-500 border border-blue-400/30 hover:bg-blue-500/30 hover:border-blue-400/50 py-3 px-6 rounded-lg font-mono font-bold disabled:opacity-50 transition-all duration-300"
                >
                  {generateQRMutation.isPending ? "GENERATING..." : "GENERATE QR CODE"}
                </button>

                {/* Generated QR Display */}
                {generatedQR && (
                  <div className={`rounded-lg p-6 text-center ${
                    actualTheme === 'dark'
                      ? 'bg-gray-800/30 border border-gray-700'
                      : 'bg-gray-100/50 border border-gray-300'
                  }`}>
                    <h3 className={`font-mono font-bold mb-4 ${
                      actualTheme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      TABLE {generatedQR.tableNumber} QR CODE
                    </h3>
                    <div className="bg-white p-4 rounded-lg inline-block mb-4">
                      {qrFormat === "png" ? (
                        <img src={generatedQR.data} alt="QR Code" className="max-w-full h-auto" />
                      ) : (
                        <div dangerouslySetInnerHTML={{ __html: generatedQR.data }} />
                      )}
                    </div>
                    <div className="flex gap-3 justify-center">
                      <button
                        onClick={() => downloadQR(generatedQR.data, `table-${generatedQR.tableNumber}-qr.${qrFormat}`)}
                        className="bg-green-500/20 text-green-500 border border-green-400/30 hover:bg-green-500/30 hover:border-green-400/50 py-2 px-4 rounded-lg font-mono font-bold transition-all duration-300"
                      >
                        DOWNLOAD
                      </button>
                      <button
                        onClick={printQRCode}
                        className="bg-blue-500/20 text-blue-500 border border-blue-400/30 hover:bg-blue-500/30 hover:border-blue-400/50 py-2 px-4 rounded-lg font-mono font-bold transition-all duration-300"
                      >
                        PRINT
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bulk QR Code Generator */}
            <div className={`backdrop-blur-sm rounded-xl p-6 ${
              actualTheme === 'dark'
                ? 'bg-gray-900/50 border border-gray-800'
                : 'bg-white/50 border border-gray-200'
            }`}>
              <h2 className={`text-xl font-mono font-bold mb-6 flex items-center gap-2 ${
                actualTheme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                <span className="bg-gradient-to-r from-green-500 to-blue-600 text-white text-sm rounded-full w-8 h-8 inline-flex items-center justify-center font-bold">∞</span>
                BULK GENERATION
              </h2>
              
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-mono font-bold mb-3 ${
                      actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      START TABLE
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="999"
                      value={bulkStart}
                      onChange={(e) => setBulkStart(Number(e.target.value))}
                      className={`w-full px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono ${
                        actualTheme === 'dark'
                          ? 'bg-gray-800/50 border border-gray-700 text-white'
                          : 'bg-gray-50/50 border border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-mono font-bold mb-3 ${
                      actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      END TABLE
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="999"
                      value={bulkEnd}
                      onChange={(e) => setBulkEnd(Number(e.target.value))}
                      className={`w-full px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono ${
                        actualTheme === 'dark'
                          ? 'bg-gray-800/50 border border-gray-700 text-white'
                          : 'bg-gray-50/50 border border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>
                </div>

                <div className={`rounded-lg p-4 ${
                  actualTheme === 'dark'
                    ? 'bg-gray-800/50 border border-gray-700'
                    : 'bg-gray-50/50 border border-gray-300'
                }`}>
                  <p className={`text-sm font-mono ${
                    actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    <strong>INFO:</strong> Will generate {Math.max(0, bulkEnd - bulkStart + 1)} QR codes
                    {bulkEnd - bulkStart > 50 && (
                      <span className={`block mt-1 ${
                        actualTheme === 'dark' ? 'text-red-400' : 'text-red-600'
                      }`}>
                        ⚠️ Maximum 50 QR codes per batch
                      </span>
                    )}
                  </p>
                </div>

                <button
                  onClick={handleGenerateBulk}
                  disabled={generateBulkMutation.isPending || bulkEnd - bulkStart > 50}
                  className="w-full bg-green-500/20 text-green-500 border border-green-400/30 hover:bg-green-500/30 hover:border-green-400/50 py-3 px-6 rounded-lg font-mono font-bold disabled:opacity-50 transition-all duration-300"
                >
                  {generateBulkMutation.isPending ? "GENERATING..." : "GENERATE BULK QR CODES"}
                </button>

                {/* Bulk QR Results */}
                {bulkQRs.length > 0 && (
                  <div className={`rounded-lg p-6 ${
                    actualTheme === 'dark'
                      ? 'bg-gray-800/30 border border-gray-700'
                      : 'bg-gray-100/50 border border-gray-300'
                  }`}>
                    <h3 className={`font-mono font-bold mb-4 ${
                      actualTheme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      GENERATED {bulkQRs.length} QR CODES
                    </h3>
                    <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                      {bulkQRs.map((qr) => (
                        <div key={qr.tableNumber} className={`rounded-lg p-3 text-center ${
                          actualTheme === 'dark'
                            ? 'bg-gray-900/50 border border-gray-700'
                            : 'bg-white/50 border border-gray-300'
                        }`}>
                          <h4 className={`font-mono text-sm font-bold mb-2 ${
                            actualTheme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}>
                            TABLE {qr.tableNumber}
                          </h4>
                          <div className="bg-white p-2 rounded mb-2">
                            {qrFormat === "png" ? (
                              <img src={qr.data} alt={`QR Code Table ${qr.tableNumber}`} className="w-full h-auto" />
                            ) : (
                              <div dangerouslySetInnerHTML={{ __html: qr.data }} />
                            )}
                          </div>
                          <button
                            onClick={() => downloadQR(qr.data, `table-${qr.tableNumber}-qr.${qrFormat}`)}
                            className="w-full bg-green-500/20 text-green-500 border border-green-400/30 hover:bg-green-500/30 hover:border-green-400/50 py-1 px-2 rounded text-xs font-mono font-bold transition-all duration-300"
                          >
                            DOWNLOAD
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className={`backdrop-blur-sm rounded-xl p-6 ${
            actualTheme === 'dark'
              ? 'bg-gray-900/50 border border-gray-800'
              : 'bg-white/50 border border-gray-200'
          }`}>
            <h2 className={`text-xl font-mono font-bold mb-6 flex items-center gap-2 ${
              actualTheme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              <span className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white text-sm rounded-full w-8 h-8 inline-flex items-center justify-center font-bold">⚡</span>
              QUICK ACTIONS
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => {
                  setBulkStart(1);
                  setBulkEnd(10);
                  handleGenerateBulk();
                }}
                disabled={generateBulkMutation.isPending}
                className="bg-blue-500/20 text-blue-500 border border-blue-400/30 hover:bg-blue-500/30 hover:border-blue-400/50 py-3 px-4 rounded-lg font-mono font-bold transition-all duration-300"
              >
                TABLES 1-10
              </button>
              <button
                onClick={() => {
                  setBulkStart(11);
                  setBulkEnd(20);
                  handleGenerateBulk();
                }}
                disabled={generateBulkMutation.isPending}
                className="bg-yellow-500/20 text-yellow-500 border border-yellow-400/30 hover:bg-yellow-500/30 hover:border-yellow-400/50 py-3 px-4 rounded-lg font-mono font-bold transition-all duration-300"
              >
                TABLES 11-20
              </button>
              <button
                onClick={() => {
                  setBulkStart(1);
                  setBulkEnd(50);
                  handleGenerateBulk();
                }}
                disabled={generateBulkMutation.isPending}
                className="bg-green-500/20 text-green-500 border border-green-400/30 hover:bg-green-500/30 hover:border-green-400/50 py-3 px-4 rounded-lg font-mono font-bold transition-all duration-300"
              >
                ALL TABLES (1-50)
              </button>
            </div>
          </div>
        </div>
      </AdminLayout>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const cookies = context.req.headers.cookie || "";
  const adminSession = getAdminSessionFromCookies(cookies);
  
  if (!adminSession) {
    return {
      redirect: {
        destination: "/admin/login",
        permanent: false,
      },
    };
  }

  return {
    props: {
      session: adminSession,
    },
  };
}; 