import { createFileRoute } from "@tanstack/react-router";
import { TownhallBoard } from "@/components/townhall/TownhallBoard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CEO 타운홀 미팅 사전 Q&A | 익명 실시간 질문 게시판" },
      {
        name: "description",
        content:
          "로그인 없이 링크만으로 참여하는 CEO 타운홀 사전 Q&A. 궁금한 점, 제안하고 싶은 이야기까지 익명으로 남기고 공감·댓글을 실시간으로 확인하세요.",
      },
      { property: "og:title", content: "CEO 타운홀 미팅 사전 Q&A" },
      {
        property: "og:description",
        content:
          "익명으로 남기는 CEO 타운홀 사전 Q&A. 카테고리별 질문·공감·댓글을 실시간으로 공유합니다.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <TownhallBoard />,
});
