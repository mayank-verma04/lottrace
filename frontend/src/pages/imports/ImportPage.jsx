import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Upload, FileText, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PageHeader } from '@/components/common/PageHeader';

const fetchImports = async () => {
  const { data } = await api.get('/imports');
  return data;
};

const createImport = async ({ file, cteType }) => {
  const { data } = await api.post('/imports', {
    filename: file.name,
    storage_key: `imports/${Date.now()}_${file.name}`,
    cte_type: cteType
  });
  return data;
};

export default function ImportPage() {
  const [file, setFile] = useState(null);
  const [cteType, setCteType] = useState('receiving');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['imports'],
    queryFn: fetchImports
  });

  const uploadMutation = useMutation({
    mutationFn: createImport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['imports'] });
      setFile(null);
    }
  });

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = () => {
    if (file) {
      uploadMutation.mutate({ file, cteType });
    }
  };

  const imports = data?.data || [];

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto">
      <PageHeader 
        title="Bulk Import"
        subtitle="Upload CSV files to create traceability events in bulk."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="col-span-1 border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Upload Data</CardTitle>
            <CardDescription>Upload CSV to create multiple events.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Event Type</label>
              <select
                value={cteType}
                onChange={(e) => setCteType(e.target.value)}
                className="w-full h-10 px-3 py-2 border rounded-md"
              >
                <option value="creation">Creation</option>
                <option value="receiving">Receiving</option>
                <option value="transformation">Transformation</option>
                <option value="shipping">Shipping</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">CSV File</label>
              <Input type="file" accept=".csv" onChange={handleFileChange} />
            </div>

            <Button
              className="w-full"
              onClick={handleUpload}
              disabled={!file || uploadMutation.isPending}
            >
              <Upload className="w-4 h-4 mr-2" />
              {uploadMutation.isPending ? 'Uploading...' : 'Upload & Process'}
            </Button>

            <div className="pt-4 border-t text-sm">
              <p className="text-muted-foreground mb-2">Need the template?</p>
              <a href="#" className="text-blue-600 hover:underline inline-flex items-center">
                <FileText className="w-4 h-4 mr-1" />
                Download {cteType} template
              </a>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-2 border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Recent Imports</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p>Loading...</p>
            ) : imports.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground border border-dashed rounded-lg">
                No past imports found.
              </div>
            ) : (
              <div className="space-y-4">
                {imports.map((job) => (
                  <div key={job.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="space-y-1">
                      <p className="font-medium flex items-center">
                        <FileText className="w-4 h-4 mr-2 text-gray-500" />
                        {job.filename}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">
                        Type: {job.cte_type} | Started: {new Date(job.created_at).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex items-center space-x-6 text-sm">
                      <div className="text-right">
                        {job.status === 'pending' || job.status === 'processing' ? (
                          <span className="flex items-center text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded-full">
                            <Clock className="w-3 h-3 mr-1" /> {job.status}
                          </span>
                        ) : job.status === 'failed' ? (
                          <span className="flex items-center text-red-600 font-medium bg-red-50 px-2 py-1 rounded-full">
                            <AlertCircle className="w-3 h-3 mr-1" /> failed
                          </span>
                        ) : (
                          <span className="flex items-center text-green-600 font-medium bg-green-50 px-2 py-1 rounded-full">
                            <CheckCircle className="w-3 h-3 mr-1" /> {job.status}
                          </span>
                        )}
                      </div>

                      {job.total_rows != null && (
                        <div className="text-xs text-right min-w-[80px]">
                          <div className="text-green-600">{job.valid_rows || 0} valid</div>
                          {job.error_rows > 0 && (
                            <div className="text-red-600 cursor-pointer hover:underline">
                              {job.error_rows} errors (log)
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
