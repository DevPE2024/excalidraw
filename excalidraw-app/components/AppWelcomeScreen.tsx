import { loginIcon } from "@excalidraw/excalidraw/components/icons";
import { POINTER_EVENTS } from "@excalidraw/common";
import { useI18n } from "@excalidraw/excalidraw/i18n";
import { WelcomeScreen } from "@excalidraw/excalidraw/index";
import React from "react";

import { isExcalidrawPlusSignedUser } from "../app_constants";

// Componentes shadcn-ui elegantes
const Card = ({ className, ...props }: React.ComponentProps<"div">) => (
  <div
    className={`bg-gradient-to-br from-slate-900/80 to-slate-800/80 text-slate-100 flex flex-col gap-6 rounded-2xl border border-slate-700/30 py-8 shadow-2xl backdrop-blur-xl ${className}`}
    {...props}
  />
);

const CardHeader = ({ className, ...props }: React.ComponentProps<"div">) => (
  <div
    className={`text-center px-8 ${className}`}
    {...props}
  />
);

const CardTitle = ({ className, ...props }: React.ComponentProps<"div">) => (
  <div
    className={`text-2xl font-bold text-slate-100 mb-2 ${className}`}
    {...props}
  />
);

const CardDescription = ({ className, ...props }: React.ComponentProps<"div">) => (
  <div
    className={`text-slate-300 text-base leading-relaxed ${className}`}
    {...props}
  />
);

const CardContent = ({ className, ...props }: React.ComponentProps<"div">) => (
  <div
    className={`px-8 ${className}`}
    {...props}
  />
);

const Button = ({ className, variant = "default", size = "default", ...props }: any) => {
  const baseClasses = "inline-flex items-center justify-center gap-3 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-300 disabled:pointer-events-none disabled:opacity-50 transform hover:scale-105 active:scale-95";
  const variantClasses: Record<string, string> = {
    default: "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl",
    outline: "border-2 border-slate-600 bg-slate-800/50 text-slate-200 hover:bg-slate-700/70 hover:border-slate-500",
    ghost: "hover:bg-slate-700/50 text-slate-200 hover:text-white"
  };
  const sizeClasses: Record<string, string> = {
    default: "h-12 px-6 py-3",
    sm: "h-10 px-4 text-sm",
    lg: "h-14 px-8 text-lg"
  };
  
  return (
    <button
      className={`${baseClasses} ${variantClasses[variant] || variantClasses.default} ${sizeClasses[size] || sizeClasses.default} ${className || ''}`}
      {...props}
    />
  );
};

const Badge = ({ className, variant = "default", ...props }: any) => {
  const baseClasses = "inline-flex items-center justify-center rounded-full border px-3 py-1 text-xs font-semibold";
  const variantClasses: Record<string, string> = {
    default: "border-blue-500/50 bg-blue-500/20 text-blue-300",
    secondary: "border-slate-500/50 bg-slate-500/20 text-slate-300"
  };
  
  return (
    <span
      className={`${baseClasses} ${variantClasses[variant] || variantClasses.default} ${className || ''}`}
      {...props}
    />
  );
};

export const AppWelcomeScreen: React.FC<{
  onCollabDialogOpen: () => any;
  isCollabEnabled: boolean;
}> = React.memo((props) => {
  const { t } = useI18n();
  
  return (
    <WelcomeScreen>
      <WelcomeScreen.Center>
        {/* Layout minimalista e elegante */}
        <div className="flex flex-col items-center justify-center min-h-[80vh] text-center">
          {/* Slogan principal */}
          <h1 className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent mb-8 leading-tight">
            Desenhe com IA. Sonhe Sem Limites.
          </h1>
          
          {/* Subheading */}
          <p className="text-xl md:text-2xl text-slate-300 font-light leading-relaxed max-w-4xl mx-auto">
            Esboce, converse e gere visuais em uma tela criativa — sua imaginação encontra a inteligência artificial.
          </p>
        </div>
      </WelcomeScreen.Center>
    </WelcomeScreen>
  );
});
