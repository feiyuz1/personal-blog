import { notImplemented } from "@/lib/api-response";

export async function POST() {
  return notImplemented({
    route: "/api/contact",
    status: "planned",
    description: "联系表单接口已预留，后续接入邮件通知或消息转发服务。",
    requestExample: {
      name: "visitor",
      email: "reader@example.com",
      message: "Hope to connect with you.",
    },
  });
}
