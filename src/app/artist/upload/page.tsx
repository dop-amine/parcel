import TrackUpload from '@/components/TrackUpload';

export default function UploadTrackPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Upload Your Track</h1>
      <TrackUpload />
    </div>
  );
}