import { Link } from "react-router";
import { ArrowRight, Leaf, Shield, Globe } from "lucide-react";

export function Home() {
  return (
    <div className="min-h-screen flex flex-col font-sans">
      <header className="border-b border-gray-200 py-4 px-6 md:px-12 flex justify-between items-center bg-white sticky top-0 z-10">
        <div className="font-serif font-bold text-2xl tracking-tight">Catalyst.</div>
        <Link 
          to="/auth" 
          className="bg-primary text-primary-foreground px-5 py-2.5 rounded-none font-medium hover:bg-gray-800 transition-colors text-sm"
        >
          Iniciar sesión / Registrarse
        </Link>
      </header>

      <main className="flex-1 flex flex-col">
        {/* Hero Section */}
        <section className="px-6 md:px-12 py-24 md:py-32 flex flex-col items-center text-center bg-background border-b border-gray-200">
          <h1 className="font-serif text-5xl md:text-7xl font-bold max-w-4xl leading-tight mb-8">
            Financia las ideas que moldean el mañana.
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 max-w-2xl mb-12 font-serif">
            Una plataforma curada para proyectos visionarios. Conectamos creadores con mecenas que creen en romper límites.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link 
              to="/auth" 
              className="bg-accent text-accent-foreground px-8 py-4 rounded-none font-bold text-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
            >
              Iniciar un Proyecto <ArrowRight size={20} />
            </Link>
            <a 
              href="#explore" 
              className="border border-primary text-primary px-8 py-4 rounded-none font-bold text-lg hover:bg-gray-50 transition-colors flex items-center justify-center"
            >
              Explorar Campañas
            </a>
          </div>
        </section>

        {/* Features Section */}
        <section id="explore" className="px-6 md:px-12 py-24 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
              <div className="flex flex-col items-start">
                <div className="bg-gray-100 p-4 mb-6 rounded-none">
                  <Shield size={32} className="text-primary" />
                </div>
                <h3 className="font-serif text-2xl font-bold mb-4">Creadores Verificados</h3>
                <p className="text-gray-600 leading-relaxed">
                  Cada campaña pasa por una rigurosa revisión editorial para garantizar viabilidad, transparencia e impacto.
                </p>
              </div>
              
              <div className="flex flex-col items-start">
                <div className="bg-gray-100 p-4 mb-6 rounded-none">
                  <Globe size={32} className="text-primary" />
                </div>
                <h3 className="font-serif text-2xl font-bold mb-4">Alcance Global</h3>
                <p className="text-gray-600 leading-relaxed">
                  Conéctate con una red mundial de mecenas. Tu ubicación geográfica no debería limitar tu ambición.
                </p>
              </div>
              
              <div className="flex flex-col items-start">
                <div className="bg-gray-100 p-4 mb-6 rounded-none">
                  <Leaf size={32} className="text-primary" />
                </div>
                <h3 className="font-serif text-2xl font-bold mb-4">Crecimiento Sostenible</h3>
                <p className="text-gray-600 leading-relaxed">
                  Priorizamos proyectos con visión a largo plazo sobre tendencias pasajeras. Construye algo que perdure.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-primary text-primary-foreground py-12 px-6 md:px-12">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="font-serif font-bold text-2xl">Catalyst.</div>
          <div className="text-sm text-gray-400">
            © 2026 Catalyst Crowdfunding. Todos los derechos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}