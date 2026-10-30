'use client';

import React, { useEffect, useState } from 'react';
import { Video, Search, Play, Clock, Tag, ExternalLink, Plus, X, Upload } from 'lucide-react';

export default function RecordingsPage() {
  const [data, setData] = useState<any>({ recordings: [], batches: [] });
  const [loading, setLoading] = useState(true);
  const [filterBatch, setFilterBatch] = useState('');
  const [search, setSearch] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    batchId: 'b_java_m1', title: '', url: '', date: '2026-10-16', durationMinutes: '90', topicTags: ''
  });
  const [uploading, setUploading] = useState(false);

  const fetchRecordings = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterBatch) params.set('batchId', filterBatch);
      const res = await fetch(`/api/recordings?${params.toString()}`);
      if (res.ok) setData(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchRecordings(); }, [filterBatch]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    try {
      const res = await fetch('/api/recordings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(uploadForm)
      });
      if (res.ok) { setShowUpload(false); fetchRecordings(); }
    } catch (err) { console.error(err); }
    finally { setUploading(false); }
  };

  const filtered = data.recordings?.filter((r: any) =>
    !search || r.title.toLowerCase().includes(search.toLowerCase()) ||
    r.course_name?.toLowerCase().includes(search.toLowerCase()) ||
    r.topic_tags?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 block mb-1">
            Lecture Archive & Learning Repository
          </span>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Class Recordings
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              {data.recordings?.length || 0} Sessions
            </span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">Archived session recordings with topic tagging and view metrics.</p>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs flex items-center gap-2 shadow-xs transition-colors"
        >
          <Upload className="w-4 h-4" /> Add Recording
        </button>
      </div>

      <div className="flex flex-wrap gap-3 items-center p-3.5 rounded-xl border border-slate-200/80 bg-white shadow-xs">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title, topic, course..."
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 transition-colors"
          />
        </div>
        <select
          value={filterBatch}
          onChange={(e) => setFilterBatch(e.target.value)}
          className="py-2 px-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 focus:outline-none focus:bg-white focus:border-blue-500 font-medium"
        >
          <option value="">All Batches</option>
          {data.batches?.map((b: any) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          [1,2,3,4,5,6].map(i => (
            <div key={i} className="h-44 rounded-xl bg-white border border-slate-200/80 animate-pulse shadow-xs"></div>
          ))
        ) : filtered?.length === 0 ? (
          <div className="col-span-3 py-16 text-center text-slate-500 bg-white rounded-xl border border-dashed border-slate-200 text-sm">
            No recordings found matching your filters.
          </div>
        ) : (
          filtered?.map((rec: any) => (
            <div key={rec.id} className="p-5 rounded-xl border border-slate-200/80 bg-white hover:border-blue-300 hover:shadow-sm transition-all flex flex-col justify-between group shadow-xs">
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200/60">
                    {rec.course_name}
                  </span>
                  <span className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {rec.duration_minutes} min
                  </span>
                </div>
                <h4 className="font-semibold text-sm text-slate-900 group-hover:text-blue-600 transition-colors mb-1.5 leading-snug">
                  {rec.title}
                </h4>
                <div className="text-xs text-slate-500 mb-3">{rec.batch_name} &bull; {rec.trainer_name}</div>
                {rec.topic_tags && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {rec.topic_tags.split(',').map((tag: string, i: number) => (
                      <span key={i} className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                        #{tag.trim()}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">{rec.date} &bull; {rec.views_count} views</span>
                <a
                  href={rec.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs transition-colors shadow-xs"
                >
                  <Play className="w-3.5 h-3.5 fill-current" /> Watch
                </a>
              </div>
            </div>
          ))
        )}
      </div>

      {showUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="text-slate-900 font-bold text-base flex items-center gap-2">
                <Video className="w-5 h-5 text-blue-600" /> Add Session Recording
              </div>
              <button onClick={() => setShowUpload(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpload} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-700 font-medium block mb-1">Session Title *</label>
                <input
                  type="text"
                  required
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm({...uploadForm, title: e.target.value})}
                  placeholder="e.g. L13: Kafka Consumer Groups Deep Dive"
                  className="w-full p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-slate-700 font-medium block mb-1">Batch *</label>
                <select
                  value={uploadForm.batchId}
                  onChange={(e) => setUploadForm({...uploadForm, batchId: e.target.value})}
                  className="w-full p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500"
                >
                  {data.batches?.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-slate-700 font-medium block mb-1">Recording URL *</label>
                <input
                  type="url"
                  required
                  value={uploadForm.url}
                  onChange={(e) => setUploadForm({...uploadForm, url: e.target.value})}
                  placeholder="https://cdn.instipilot.com/..."
                  className="w-full p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-medium block mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={uploadForm.date}
                    onChange={(e) => setUploadForm({...uploadForm, date: e.target.value})}
                    className="w-full p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-medium block mb-1">Duration (mins)</label>
                  <input
                    type="number"
                    value={uploadForm.durationMinutes}
                    onChange={(e) => setUploadForm({...uploadForm, durationMinutes: e.target.value})}
                    className="w-full p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="text-slate-700 font-medium block mb-1">Topic Tags (comma separated)</label>
                <input
                  type="text"
                  value={uploadForm.topicTags}
                  onChange={(e) => setUploadForm({...uploadForm, topicTags: e.target.value})}
                  placeholder="kafka, microservices, java"
                  className="w-full p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowUpload(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
                >
                  {uploading ? 'Saving...' : 'Save Recording'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
