"use client";

import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Send } from "lucide-react";
import { createCallbackRequest } from "@/actions/callback";
import { CallbackSchema, type CallbackInput } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { TurnstileWidget } from "@/components/forms/TurnstileWidget";

type CallbackFormProps = {
  title?: string;
  description?: string;
  compact?: boolean;
};

type CallbackFormValues = CallbackInput;

export function CallbackForm({
  title = "Заказать консультацию",
  description = "Оставьте контакты — наш садовник перезвонит в течение 30 минут.",
  compact = false,
}: CallbackFormProps) {
  const [turnstileToken, setTurnstileToken] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CallbackFormValues>({
    resolver: zodResolver(CallbackSchema),
    defaultValues: { name: "", phone: "", website: "", turnstileToken: "" },
  });

  const handleTurnstileVerify = useCallback(
    (token: string) => {
      setTurnstileToken(token);
      setValue("turnstileToken", token, { shouldValidate: true });
    },
    [setValue]
  );

  const handleTurnstileExpire = useCallback(() => {
    setTurnstileToken("");
    setValue("turnstileToken", "", { shouldValidate: true });
  }, [setValue]);

  const onSubmit = async (data: CallbackFormValues) => {
    const payload: CallbackInput = {
      ...data,
      turnstileToken: turnstileToken || data.turnstileToken,
    };

    const result = await createCallbackRequest(payload);

    if (result.success) {
      reset();
      setTurnstileToken("");
      toast({
        variant: "success",
        title: "Заявка успешно отправлена!",
        description: "Мы свяжемся с вами в ближайшее время.",
      });
    } else {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: result.error,
      });
    }
  };

  const Wrapper = compact ? "div" : Card;

  return (
    <Wrapper
      className={
        compact
          ? ""
          : "border-emerald-100 shadow-md transition-shadow duration-300 hover:shadow-lg"
      }
    >
      {!compact && (
        <CardHeader>
          <CardTitle className="text-emerald-800">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
      )}
      <CardContent className={compact ? "p-0" : undefined}>
        {compact && (
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-emerald-800">{title}</h3>
            <p className="text-sm text-stone-600">{description}</p>
          </div>
        )}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div
            className="absolute -left-[9999px] h-0 w-0 overflow-hidden"
            aria-hidden="true"
          >
            <Label htmlFor="callback-website">Website</Label>
            <Input
              id="callback-website"
              tabIndex={-1}
              autoComplete="off"
              {...register("website")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="callback-name">Ваше имя</Label>
            <Input
              id="callback-name"
              placeholder="Иван Иванов"
              disabled={isSubmitting}
              aria-invalid={!!errors.name}
              className="border-emerald-100 focus-visible:ring-emerald-800"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="callback-phone">Телефон</Label>
            <Input
              id="callback-phone"
              type="tel"
              placeholder="+7 (999) 123-45-67"
              disabled={isSubmitting}
              aria-invalid={!!errors.phone}
              className="border-emerald-100 focus-visible:ring-emerald-800"
              {...register("phone")}
            />
            {errors.phone && (
              <p className="text-xs text-destructive">{errors.phone.message}</p>
            )}
          </div>

          <input type="hidden" {...register("turnstileToken")} />

          <TurnstileWidget
            onVerify={handleTurnstileVerify}
            onExpire={handleTurnstileExpire}
            onError={handleTurnstileExpire}
          />
          {errors.turnstileToken && (
            <p className="text-xs text-destructive">
              {errors.turnstileToken.message}
            </p>
          )}

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-emerald-800 transition-colors duration-200 hover:bg-emerald-900"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Отправка…
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Отправить заявку
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Wrapper>
  );
}
