import { styled } from "@linaria/react";

export const Dialog = styled.dialog`
  max-width: min(560px, calc(100vw - 32px));
  max-height: min(720px, calc(100vh - 32px));
  border: 1px solid var(--color-border, #2b3a50);
  border-radius: 12px;
  padding: 28px;
  color: var(--color-text, #eef3fa);
  background: var(--color-surface, #151e2b);
  box-shadow: var(--shadow-dialog, 0 24px 80px #000a);

  &::backdrop {
    background: var(--color-overlay, #030811c9);
    backdrop-filter: blur(5px);
  }
`;

export const Header = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;

  h2 {
    margin: 0;
    font-size: 23px;
    letter-spacing: -0.6px;
  }
`;

export const TitleRow = styled.div`
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 10px;
`;

export const CloseButton = styled.button`
  min-width: auto;
  min-height: auto;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  font-size: 24px;
  line-height: 1;
`;
