import { createFileRoute } from "@tanstack/react-router";
import { TownhallBoard } from "@/components/townhall/TownhallBoard";

export const Route = createFileRoute("/s/$slug")({
  head: () => ({
    meta: [
      { title: "타운홀 회차별 사전 Q&A | CEO 타운홀 미팅" },
      {
        name: "description",
        content:
          "회차별 CEO 타운홀 미팅 사전 Q&A 페이지입니다. 익명으로 질문과 의견을 남기고 공감·댓글을 실시간으로 확인하세요.",
      },
      { property: "og:title", content: "타운홀 회차별 사전 Q&A" },
      {
        property: "og:description",
        content: "회차별 CEO 타운홀 사전 Q&A. 익명 질문·공감·댓글을 실시간으로 공유합니다.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EventBoard,
});

function EventBoard() {
  const { slug } = Route.useParams();
  return <TownhallBoard slug={slug} />;
}
