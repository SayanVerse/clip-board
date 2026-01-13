import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Mail, 
  Phone, 
  Lock, 
  User, 
  ArrowRight, 
  Eye, 
  EyeOff,
  Sparkles,
  Github,
  Twitter
} from "lucide-react";
import { AnimatedBackground } from "@/components/AnimatedBackground";

type AuthMode = "login" | "signup";
type InputMethod = "email" | "phone";

export default function Auth() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>("login");
  const [inputMethod, setInputMethod] = useState<InputMethod>("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");

  const handleEmailLogin = async () => {
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Welcome back!");
      navigate("/");
    }
  };

  const handlePhoneLogin = async () => {
    if (!phone || !password) {
      toast.error("Please fill in all fields");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      phone,
      password,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Welcome back!");
      navigate("/");
    }
  };

  const handleEmailSignup = async () => {
    if (!email || !password || !fullName) {
      toast.error("Please fill in all fields");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          full_name: fullName,
        },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Account created! You can now sign in.");
      setMode("login");
    }
  };

  const handlePhoneSignup = async () => {
    if (!phone) {
      toast.error("Please enter your phone number");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      phone,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      setOtpSent(true);
      toast.success("OTP sent to your phone!");
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      toast.error("Please enter the 6-digit OTP");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      phone,
      token: otp,
      type: "sms",
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Phone verified! Welcome!");
      navigate("/");
    }
  };

  const handleGoogleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });
    if (error) {
      toast.error("Failed to sign in with Google");
    }
  };

  const handleGithubSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });
    if (error) {
      toast.error("Failed to sign in with GitHub");
    }
  };

  const handleTwitterSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "twitter",
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });
    if (error) {
      toast.error("Failed to sign in with Twitter");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <AnimatedBackground />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="border-border/50 bg-card/80 backdrop-blur-xl shadow-2xl">
          <CardHeader className="text-center space-y-2">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
              className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mb-2"
            >
              <Sparkles className="w-8 h-8 text-primary-foreground" />
            </motion.div>
            <CardTitle className="text-2xl font-bold">
              {mode === "login" ? "Welcome Back" : "Create Account"}
            </CardTitle>
            <CardDescription>
              {mode === "login" 
                ? "Sign in to sync your clipboard across devices" 
                : "Join us and never lose your clipboard again"}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Social Sign In */}
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="outline"
                    className="w-full h-12 relative overflow-hidden group"
                    onClick={handleGoogleSignIn}
                  >
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-red-500/10 via-yellow-500/10 to-green-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  </Button>
                </motion.div>
                
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="outline"
                    className="w-full h-12 relative overflow-hidden group"
                    onClick={handleGithubSignIn}
                  >
                    <motion.div
                      className="absolute inset-0 bg-foreground/5 opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                    <Github className="w-5 h-5" />
                  </Button>
                </motion.div>
                
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="outline"
                    className="w-full h-12 relative overflow-hidden group"
                    onClick={handleTwitterSignIn}
                  >
                    <motion.div
                      className="absolute inset-0 bg-sky-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                    <Twitter className="w-5 h-5 text-sky-500" />
                  </Button>
                </motion.div>
              </div>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>
            </div>

            {/* Mode Toggle */}
            <Tabs value={mode} onValueChange={(v) => setMode(v as AuthMode)} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  Sign In
                </TabsTrigger>
                <TabsTrigger value="signup" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  Sign Up
                </TabsTrigger>
              </TabsList>

              <AnimatePresence mode="wait">
                <TabsContent value="login" className="mt-4 space-y-4">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-4"
                  >
                    {/* Input Method Toggle */}
                    <div className="flex gap-2 p-1 bg-muted rounded-lg">
                      <Button
                        variant={inputMethod === "email" ? "default" : "ghost"}
                        size="sm"
                        className="flex-1 gap-2"
                        onClick={() => setInputMethod("email")}
                      >
                        <Mail className="w-4 h-4" />
                        Email
                      </Button>
                      <Button
                        variant={inputMethod === "phone" ? "default" : "ghost"}
                        size="sm"
                        className="flex-1 gap-2"
                        onClick={() => setInputMethod("phone")}
                      >
                        <Phone className="w-4 h-4" />
                        Phone
                      </Button>
                    </div>

                    {inputMethod === "email" ? (
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="email"
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="phone"
                            type="tel"
                            placeholder="+1234567890"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-10 pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <Eye className="w-4 h-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        className="w-full gap-2 h-11"
                        onClick={inputMethod === "email" ? handleEmailLogin : handlePhoneLogin}
                        disabled={loading}
                      >
                        {loading ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full"
                          />
                        ) : (
                          <>
                            Sign In
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </Button>
                    </motion.div>
                  </motion.div>
                </TabsContent>

                <TabsContent value="signup" className="mt-4 space-y-4">
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    {/* Input Method Toggle */}
                    <div className="flex gap-2 p-1 bg-muted rounded-lg">
                      <Button
                        variant={inputMethod === "email" ? "default" : "ghost"}
                        size="sm"
                        className="flex-1 gap-2"
                        onClick={() => { setInputMethod("email"); setOtpSent(false); }}
                      >
                        <Mail className="w-4 h-4" />
                        Email
                      </Button>
                      <Button
                        variant={inputMethod === "phone" ? "default" : "ghost"}
                        size="sm"
                        className="flex-1 gap-2"
                        onClick={() => { setInputMethod("phone"); setOtpSent(false); }}
                      >
                        <Phone className="w-4 h-4" />
                        Phone (OTP)
                      </Button>
                    </div>

                    <AnimatePresence mode="wait">
                      {inputMethod === "email" ? (
                        <motion.div
                          key="email-signup"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="space-y-4"
                        >
                          <div className="space-y-2">
                            <Label htmlFor="fullName">Full Name</Label>
                            <div className="relative">
                              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                              <Input
                                id="fullName"
                                type="text"
                                placeholder="John Doe"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="pl-10"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="signupEmail">Email</Label>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                              <Input
                                id="signupEmail"
                                type="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="pl-10"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="signupPassword">Password</Label>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                              <Input
                                id="signupPassword"
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="pl-10 pr-10"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                                onClick={() => setShowPassword(!showPassword)}
                              >
                                {showPassword ? (
                                  <EyeOff className="w-4 h-4 text-muted-foreground" />
                                ) : (
                                  <Eye className="w-4 h-4 text-muted-foreground" />
                                )}
                              </Button>
                            </div>
                          </div>

                          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                            <Button
                              className="w-full gap-2 h-11"
                              onClick={handleEmailSignup}
                              disabled={loading}
                            >
                              {loading ? (
                                <motion.div
                                  animate={{ rotate: 360 }}
                                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                  className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full"
                                />
                              ) : (
                                <>
                                  Create Account
                                  <ArrowRight className="w-4 h-4" />
                                </>
                              )}
                            </Button>
                          </motion.div>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="phone-signup"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="space-y-4"
                        >
                          {!otpSent ? (
                            <>
                              <div className="space-y-2">
                                <Label htmlFor="signupPhone">Phone Number</Label>
                                <div className="relative">
                                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                  <Input
                                    id="signupPhone"
                                    type="tel"
                                    placeholder="+1234567890"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="pl-10"
                                  />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  We'll send you a verification code via SMS
                                </p>
                              </div>

                              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                <Button
                                  className="w-full gap-2 h-11"
                                  onClick={handlePhoneSignup}
                                  disabled={loading}
                                >
                                  {loading ? (
                                    <motion.div
                                      animate={{ rotate: 360 }}
                                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                      className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full"
                                    />
                                  ) : (
                                    <>
                                      Send OTP
                                      <ArrowRight className="w-4 h-4" />
                                    </>
                                  )}
                                </Button>
                              </motion.div>
                            </>
                          ) : (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="space-y-4"
                            >
                              <div className="text-center space-y-2">
                                <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                  <Phone className="w-6 h-6 text-primary" />
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  Enter the 6-digit code sent to
                                </p>
                                <p className="font-medium">{phone}</p>
                              </div>

                              <div className="flex justify-center">
                                <InputOTP
                                  maxLength={6}
                                  value={otp}
                                  onChange={(value) => setOtp(value)}
                                >
                                  <InputOTPGroup>
                                    <InputOTPSlot index={0} />
                                    <InputOTPSlot index={1} />
                                    <InputOTPSlot index={2} />
                                    <InputOTPSlot index={3} />
                                    <InputOTPSlot index={4} />
                                    <InputOTPSlot index={5} />
                                  </InputOTPGroup>
                                </InputOTP>
                              </div>

                              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                <Button
                                  className="w-full gap-2 h-11"
                                  onClick={handleVerifyOtp}
                                  disabled={loading || otp.length !== 6}
                                >
                                  {loading ? (
                                    <motion.div
                                      animate={{ rotate: 360 }}
                                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                      className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full"
                                    />
                                  ) : (
                                    <>
                                      Verify & Continue
                                      <ArrowRight className="w-4 h-4" />
                                    </>
                                  )}
                                </Button>
                              </motion.div>

                              <Button
                                variant="ghost"
                                className="w-full text-sm"
                                onClick={() => setOtpSent(false)}
                              >
                                Change phone number
                              </Button>
                            </motion.div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </TabsContent>
              </AnimatePresence>
            </Tabs>

            {/* Back to Home */}
            <div className="text-center">
              <Button
                variant="link"
                className="text-muted-foreground"
                onClick={() => navigate("/")}
              >
                ← Back to Clipboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
