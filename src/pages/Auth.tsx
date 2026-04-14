import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, ArrowRight, ArrowLeft, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type AuthView = "signin" | "signup" | "forgot";

const Auth = () => {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [view, setView] = useState<AuthView>("signin");
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string; name?: string; resetEmail?: string }>({});

  // Animated background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let time = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Stars
    const stars = Array.from({ length: 200 }, () => ({
      x: Math.random(),
      y: Math.random(),
      size: Math.random() * 2 + 0.5,
      twinkle: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.02 + 0.005,
    }));

    // Floating objects data
    const floatingObjects = [
      { type: "rocket", x: 0.12, y: 0.18, size: 60, drift: 0, rot: 0 },
      { type: "handshake", x: 0.88, y: 0.7, size: 65, drift: 1.5, rot: 0 },
      { type: "magnifier", x: 0.08, y: 0.65, size: 55, drift: 3, rot: 0 },
      { type: "key", x: 0.85, y: 0.2, size: 50, drift: 4.5, rot: 0 },
    ];

    const drawRocket = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, rot: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot - 0.6);
      const s = size / 50;
      // Body
      ctx.beginPath();
      ctx.fillStyle = "#c084fc";
      ctx.ellipse(0, 0, 12 * s, 28 * s, 0, 0, Math.PI * 2);
      ctx.fill();
      // Nose
      ctx.beginPath();
      ctx.fillStyle = "#e879f9";
      ctx.moveTo(-8 * s, -24 * s);
      ctx.lineTo(0, -40 * s);
      ctx.lineTo(8 * s, -24 * s);
      ctx.fill();
      // Window
      ctx.beginPath();
      ctx.fillStyle = "#67e8f9";
      ctx.arc(0, -8 * s, 6 * s, 0, Math.PI * 2);
      ctx.fill();
      // Fins
      ctx.fillStyle = "#a855f7";
      ctx.beginPath();
      ctx.moveTo(-12 * s, 16 * s);
      ctx.lineTo(-22 * s, 30 * s);
      ctx.lineTo(-6 * s, 24 * s);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(12 * s, 16 * s);
      ctx.lineTo(22 * s, 30 * s);
      ctx.lineTo(6 * s, 24 * s);
      ctx.fill();
      // Flame
      ctx.beginPath();
      ctx.fillStyle = "#ff8c00";
      ctx.moveTo(-6 * s, 28 * s);
      ctx.quadraticCurveTo(0, 46 * s + Math.sin(time * 8) * 4 * s, 6 * s, 28 * s);
      ctx.fill();
      ctx.beginPath();
      ctx.fillStyle = "#fbbf24";
      ctx.moveTo(-3 * s, 28 * s);
      ctx.quadraticCurveTo(0, 38 * s + Math.sin(time * 10) * 3 * s, 3 * s, 28 * s);
      ctx.fill();
      ctx.restore();
    };

    const drawHandshake = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, rot: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);
      const s = size / 50;
      // Platform
      ctx.beginPath();
      ctx.fillStyle = "#1e1b4b";
      ctx.roundRect(-28 * s, 8 * s, 56 * s, 14 * s, 6 * s);
      ctx.fill();
      // Left hand
      ctx.fillStyle = "#c084fc";
      ctx.beginPath();
      ctx.roundRect(-24 * s, -6 * s, 22 * s, 16 * s, 4 * s);
      ctx.fill();
      // Right hand
      ctx.fillStyle = "#e879f9";
      ctx.beginPath();
      ctx.roundRect(2 * s, -6 * s, 22 * s, 16 * s, 4 * s);
      ctx.fill();
      // Clasp
      ctx.fillStyle = "#fbbf24";
      ctx.beginPath();
      ctx.arc(0, 2 * s, 7 * s, 0, Math.PI * 2);
      ctx.fill();
      // Sparkles
      ctx.fillStyle = "#fde68a";
      for (let i = 0; i < 3; i++) {
        const angle = (i / 3) * Math.PI * 2 + time * 2;
        const sx = Math.cos(angle) * 18 * s;
        const sy = Math.sin(angle) * 12 * s - 6 * s;
        ctx.beginPath();
        ctx.arc(sx, sy, 2 * s, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    };

    const drawMagnifier = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, rot: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);
      const s = size / 50;
      // Handle
      ctx.strokeStyle = "#a855f7";
      ctx.lineWidth = 5 * s;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(12 * s, 12 * s);
      ctx.lineTo(24 * s, 24 * s);
      ctx.stroke();
      // Lens ring
      ctx.strokeStyle = "#c084fc";
      ctx.lineWidth = 4 * s;
      ctx.beginPath();
      ctx.arc(0, 0, 16 * s, 0, Math.PI * 2);
      ctx.stroke();
      // Lens glass
      ctx.fillStyle = "rgba(139, 92, 246, 0.25)";
      ctx.beginPath();
      ctx.arc(0, 0, 14 * s, 0, Math.PI * 2);
      ctx.fill();
      // Shine
      ctx.strokeStyle = "rgba(255,255,255,0.4)";
      ctx.lineWidth = 2 * s;
      ctx.beginPath();
      ctx.arc(-4 * s, -4 * s, 8 * s, -0.8, 0.3);
      ctx.stroke();
      ctx.restore();
    };

    const drawKey = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, rot: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);
      const s = size / 50;
      // Bow (ring)
      ctx.strokeStyle = "#d4a017";
      ctx.lineWidth = 4 * s;
      ctx.beginPath();
      ctx.arc(0, -12 * s, 12 * s, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "rgba(212, 160, 23, 0.15)";
      ctx.fill();
      // Shaft
      ctx.strokeStyle = "#c9a84c";
      ctx.lineWidth = 4 * s;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, 28 * s);
      ctx.stroke();
      // Teeth
      ctx.beginPath();
      ctx.moveTo(0, 22 * s);
      ctx.lineTo(8 * s, 22 * s);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, 28 * s);
      ctx.lineTo(10 * s, 28 * s);
      ctx.stroke();
      // Glow
      ctx.shadowColor = "#fbbf24";
      ctx.shadowBlur = 20 * s;
      ctx.strokeStyle = "rgba(251, 191, 36, 0.3)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, -12 * s, 16 * s, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.restore();
    };

    const animate = () => {
      time += 0.016;
      const w = canvas.width;
      const h = canvas.height;

      // Dark purple-black gradient background
      const bg = ctx.createLinearGradient(0, 0, w, h);
      bg.addColorStop(0, "#0a0014");
      bg.addColorStop(0.3, "#120024");
      bg.addColorStop(0.6, "#1a0030");
      bg.addColorStop(1, "#0d0018");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      // Dynamic gradient waves
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.globalAlpha = 0.08 + i * 0.02;
        const gradient = ctx.createLinearGradient(0, 0, w, h);
        gradient.addColorStop(0, "#B13BFF");
        gradient.addColorStop(0.5, "#FF4405");
        gradient.addColorStop(1, "#c9a84c");
        ctx.fillStyle = gradient;
        for (let x = 0; x <= w; x += 4) {
          const y = h * 0.5 +
            Math.sin(x * 0.003 + time * 0.5 + i * 2) * 80 +
            Math.sin(x * 0.007 + time * 0.3 + i) * 40 +
            Math.cos(x * 0.002 + time * 0.4) * 60;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.lineTo(w, h);
        ctx.lineTo(0, h);
        ctx.closePath();
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Golden light beam sweep
      const beamX = w * 0.5 + Math.sin(time * 0.3) * w * 0.4;
      const beamGrad = ctx.createRadialGradient(beamX, 0, 0, beamX, h * 0.6, h * 0.8);
      beamGrad.addColorStop(0, "rgba(255, 165, 0, 0.12)");
      beamGrad.addColorStop(0.3, "rgba(212, 160, 23, 0.06)");
      beamGrad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = beamGrad;
      ctx.fillRect(0, 0, w, h);

      // Stars
      stars.forEach((star) => {
        const alpha = 0.3 + 0.7 * Math.abs(Math.sin(star.twinkle + time * star.speed * 60));
        ctx.beginPath();
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.arc(star.x * w, star.y * h, star.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw floating objects
      floatingObjects.forEach((obj) => {
        const px = obj.x * w + Math.sin(time * 0.5 + obj.drift) * 15;
        const py = obj.y * h + Math.cos(time * 0.4 + obj.drift) * 20;
        const rot = Math.sin(time * 0.3 + obj.drift) * 0.15;

        if (obj.type === "rocket") drawRocket(ctx, px, py, obj.size, rot);
        else if (obj.type === "handshake") drawHandshake(ctx, px, py, obj.size, rot);
        else if (obj.type === "magnifier") drawMagnifier(ctx, px, py, obj.size, rot);
        else if (obj.type === "key") drawKey(ctx, px, py, obj.size, rot);
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  const validateSignIn = () => {
    const errs: typeof errors = {};
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "Vui lòng nhập email hợp lệ";
    if (!password || !/^\d{8}$/.test(password)) errs.password = "Mật khẩu phải đúng 8 chữ số";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateSignUp = () => {
    const errs: typeof errors = {};
    if (!name.trim()) errs.name = "Vui lòng nhập tên";
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "Vui lòng nhập email hợp lệ";
    if (!password || !/^\d{8}$/.test(password)) errs.password = "Mật khẩu phải đúng 8 chữ số";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateSignIn()) {
      toast.success("Đăng nhập thành công!");
      navigate("/");
    }
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateSignUp()) {
      toast.success("Tạo tài khoản thành công!");
      navigate("/onboarding");
    }
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resetEmail)) {
      setErrors({ resetEmail: "Vui lòng nhập email hợp lệ" });
      return;
    }
    setErrors({});
    toast.success("Đã gửi link đặt lại mật khẩu! Vui lòng kiểm tra email.");
    setResetEmail("");
    setView("signin");
  };

  const clearForm = () => {
    setEmail("");
    setPassword("");
    setName("");
    setResetEmail("");
    setErrors({});
    setShowPassword(false);
  };

  const switchView = (v: AuthView) => {
    clearForm();
    setView(v);
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden flex items-center justify-center">
      {/* 3D Animated Background */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Auth Card */}
      <div className="relative z-10 w-full max-w-md mx-4">
        <div
          className="rounded-2xl p-8 shadow-2xl"
          style={{
            background: "linear-gradient(145deg, rgba(120, 80, 20, 0.35), rgba(80, 50, 10, 0.45))",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(201, 168, 76, 0.3)",
            boxShadow: "0 0 60px rgba(201, 168, 76, 0.1), inset 0 1px 0 rgba(255,255,255,0.05)",
          }}
        >
          {/* Logo */}
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold" style={{ color: "#fde68a" }}>
              TalentNet
            </h1>
            <p className="text-sm mt-1" style={{ color: "#d4a76a" }}>
              {view === "forgot" ? "Đặt lại mật khẩu của bạn" : "Chào mừng trở lại mạng lưới của bạn"}
            </p>
          </div>

          {/* Forgot Password View */}
          {view === "forgot" && (
            <form onSubmit={handleForgotPassword} className="space-y-5">
              <p className="text-sm text-center" style={{ color: "#c9a84c" }}>
                Nhập email để nhận link đặt lại mật khẩu
              </p>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "#c9a84c" }} />
                <Input
                  type="email"
                  placeholder="Email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="pl-10 h-12 border-0 text-sm"
                  style={{
                    background: "rgba(40, 25, 10, 0.6)",
                    color: "#fde68a",
                    borderBottom: "1px solid rgba(201,168,76,0.3)",
                  }}
                />
                {errors.resetEmail && <p className="text-xs mt-1 text-destructive">{errors.resetEmail}</p>}
              </div>
              <button
                type="submit"
                className="w-full h-12 rounded-lg font-semibold text-white transition-all hover:brightness-110"
                style={{
                  background: "linear-gradient(135deg, #B13BFF, #9333ea)",
                  boxShadow: "0 4px 15px rgba(177, 59, 255, 0.4)",
                }}
              >
                Gửi link đặt lại
              </button>
              <button
                type="button"
                onClick={() => switchView("signin")}
                className="w-full flex items-center justify-center gap-2 text-sm hover:underline"
                style={{ color: "#c9a84c" }}
              >
                <ArrowLeft className="h-4 w-4" /> Quay lại Đăng nhập
              </button>
            </form>
          )}

          {/* Sign In / Sign Up Views */}
          {view !== "forgot" && (
            <>
              {/* Tab Switch */}
              <div className="flex rounded-lg overflow-hidden mb-6" style={{ background: "rgba(40, 25, 10, 0.5)" }}>
                <button
                  onClick={() => switchView("signin")}
                  className="flex-1 py-2.5 text-sm font-semibold transition-all"
                  style={{
                    background: view === "signin" ? "linear-gradient(135deg, #d4a017, #b8860b)" : "transparent",
                    color: view === "signin" ? "#1a0a00" : "#c9a84c",
                  }}
                >
                  Đăng nhập
                </button>
                <button
                  onClick={() => switchView("signup")}
                  className="flex-1 py-2.5 text-sm font-semibold transition-all"
                  style={{
                    background: view === "signup" ? "linear-gradient(135deg, #d4a017, #b8860b)" : "transparent",
                    color: view === "signup" ? "#1a0a00" : "#c9a84c",
                  }}
                >
                  Tạo tài khoản
                </button>
              </div>

              {/* Google Button */}
              <button
                className="w-full h-12 rounded-lg flex items-center justify-center gap-3 font-medium text-sm mb-4 transition-all hover:brightness-110"
                style={{
                  background: "rgba(40, 25, 10, 0.6)",
                  border: "1px solid rgba(201,168,76,0.3)",
                  color: "#fde68a",
                }}
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Tiếp tục với Google
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px" style={{ background: "rgba(201,168,76,0.2)" }} />
                <span className="text-xs uppercase tracking-wider" style={{ color: "#8b7355" }}>
                  Hoặc tiếp tục với email
                </span>
                <div className="flex-1 h-px" style={{ background: "rgba(201,168,76,0.2)" }} />
              </div>

              {/* Form */}
              <form onSubmit={view === "signin" ? handleSignIn : handleSignUp} className="space-y-4">
                {view === "signup" && (
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "#c9a84c" }} />
                    <Input
                      placeholder="Họ và tên"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-10 h-12 border-0 text-sm"
                      style={{
                        background: "rgba(40, 25, 10, 0.6)",
                        color: "#fde68a",
                        borderBottom: "1px solid rgba(201,168,76,0.3)",
                      }}
                    />
                    {errors.name && <p className="text-xs mt-1 text-destructive">{errors.name}</p>}
                  </div>
                )}

                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "#c9a84c" }} />
                  <Input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12 border-0 text-sm"
                    style={{
                      background: "rgba(40, 25, 10, 0.6)",
                      color: "#fde68a",
                      borderBottom: "1px solid rgba(201,168,76,0.3)",
                    }}
                  />
                  {errors.email && <p className="text-xs mt-1 text-destructive">{errors.email}</p>}
                </div>

                <div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "#c9a84c" }} />
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Mật khẩu (8 chữ số)"
                      value={password}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "");
                        if (val.length <= 8) setPassword(val);
                      }}
                      maxLength={8}
                      inputMode="numeric"
                      className="pl-10 pr-10 h-12 border-0 text-sm"
                      style={{
                        background: "rgba(40, 25, 10, 0.6)",
                        color: "#fde68a",
                        borderBottom: "1px solid rgba(201,168,76,0.3)",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                      style={{ color: "#c9a84c" }}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs mt-1 text-destructive">{errors.password}</p>}

                  {view === "signin" && (
                    <div className="text-right mt-1.5">
                      <button
                        type="button"
                        onClick={() => switchView("forgot")}
                        className="text-xs font-medium hover:underline"
                        style={{ color: "#B13BFF" }}
                      >
                        Quên mật khẩu?
                      </button>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full h-12 rounded-lg font-semibold text-white flex items-center justify-center gap-2 transition-all hover:brightness-110"
                  style={{
                    background: "linear-gradient(135deg, #FF4405, #e03e00)",
                    boxShadow: "0 4px 20px rgba(255, 68, 5, 0.35)",
                  }}
                >
                  {view === "signin" ? "Đăng nhập" : "Tạo tài khoản"}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>

              {/* Footer */}
              <p className="text-center text-xs mt-5" style={{ color: "#8b7355" }}>
                Bằng cách tiếp tục, bạn đồng ý với{" "}
                <a href="#" className="underline" style={{ color: "#c9a84c" }}>Điều khoản</a> và{" "}
                <a href="#" className="underline" style={{ color: "#c9a84c" }}>Chính sách bảo mật</a> của TalentNet
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
