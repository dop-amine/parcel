import TrackUpload from '@/components/TrackUpload';

export default function UploadTrackPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-4xl font-bold text-white mb-8 text-center">Upload Your Track</h1>
      <TrackUpload />
    </div>
  );
}