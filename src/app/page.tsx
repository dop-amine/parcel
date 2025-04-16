import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-5xl font-bold text-primary mb-6">
          Discover and License Amazing Music
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          A platform connecting artists and music executives. Upload your tracks,
          discover new music, and license tracks for your projects.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/signup"
            className="px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Get Started
          </Link>
          <Link
            href="/explore"
            className="px-6 py-3 border border-input rounded-md hover:bg-accent"
          >
            Explore Tracks
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Why Choose Us</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 bg-card rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-3">For Artists</h3>
            <p className="text-muted-foreground">
              Upload your tracks easily, set your terms, and connect with music
              executives looking for your sound.
            </p>
          </div>
          <div className="p-6 bg-card rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-3">For Executives</h3>
            <p className="text-muted-foreground">
              Discover and license high-quality tracks from talented artists
              worldwide.
            </p>
          </div>
          <div className="p-6 bg-card rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-3">Secure Licensing</h3>
            <p className="text-muted-foreground">
              Clear usage rights and secure transactions for both artists and
              licensees.
            </p>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-3xl font-bold mb-6">Ready to Get Started?</h2>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Join our community of artists and music executives today.
        </p>
        <Link
          href="/signup"
          className="px-8 py-4 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 text-lg"
        >
          Create Your Account
        </Link>
      </section>
    </div>
  );
}
