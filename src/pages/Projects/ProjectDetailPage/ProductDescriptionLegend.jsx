import { useState } from 'react';
import {
    AlertTriangle,
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    Copy,
    FileText,
    Info,
    Sparkles,
    XCircle
} from 'lucide-react';

/**
 * Chú giải cho luồng "Mô tả sản phẩm (Thông tin chuẩn)".
 * Nội dung bám sát code hiện tại:
 *  - ERP/.../ProjectProductDescription.Service.ts  (upload, trích xuất, duyệt)
 *  - ERP/.../qc/services/Qc.Service.ts              (QC chỉ lấy bản APPROVED mới nhất)
 *  - getvini_ai_service/.../document_extract        (pdfplumber + vision cho trang ảnh)
 *  - getvini_ai_service/.../product_info_format     (AI formatting chỉ chọn dòng, không viết lại chữ)
 *  - getvini_ai_service/.../infra/llm/prompts.py    (VERIFY_SYSTEM: value / misleading / omission / unresolved)
 * Nếu đổi hành vi ở các file trên, cập nhật lại các câu bên dưới.
 */

const PIPELINE = [
    { title: 'Upload', body: 'Chọn file .pdf hoặc .docx cho từng sản phẩm.' },
    { title: 'Trích xuất chữ', body: 'Hệ thống đọc chữ trong file và đưa vào ô "Nội dung trích xuất".' },
    { title: 'Bạn kiểm tra và sửa', body: 'Nội dung trong ô này mới là bản chuẩn, không phải file gốc.' },
    { title: 'PM duyệt', body: 'Chỉ PM phụ trách duyệt. Mỗi lần duyệt tạo một phiên bản mới.' },
    { title: 'QC đối chiếu', body: 'QC luôn dùng phiên bản đã duyệt mới nhất của dự án.' }
];

const QC_USES = [
    'Tên sản phẩm',
    'Nội dung trích xuất (đúng như đang hiển thị sau khi bạn sửa)',
    'Chú thích (viết yêu cầu "phải nêu…" ở đây nếu cần)'
];

const QC_IGNORES = [
    'File gốc đã upload (chỉ để lưu trữ và xem lại)',
    'Tài liệu bổ sung (chỉ để tham khảo, QC không đọc)',
    'Hình ảnh nằm trong file, trừ trang PDF là ảnh/scan nguyên trang',
    'Nội dung ở header, footer, text box của file Word'
];

const CHECK_TYPES = [
    {
        label: 'Sai giá trị',
        body: 'Số liệu, tên, thuộc tính, điều kiện hoặc phạm vi khác với bản chuẩn, hoặc nói quá mức bản chuẩn cho phép.'
    },
    {
        label: 'Dễ gây hiểu nhầm',
        body: 'Đúng chữ nhưng người xem dễ hiểu thành điều khác, ví dụ bỏ điều kiện khuyến mãi hoặc gán ưu đãi sang sản phẩm khác.'
    },
    {
        label: 'Thiếu thông tin bắt buộc',
        body: 'Bản chuẩn ghi rõ "phải nêu" một điều kiện hoặc khuyến cáo, nhưng kịch bản nói về chủ đề đó mà không nêu.'
    },
    {
        label: 'Chưa đối chiếu được',
        body: 'Kịch bản nhắc đến nội dung không có trong bản chuẩn. Đây không phải lỗi, nhưng QC không có căn cứ để kết luận.'
    }
];

const WARNINGS = [
    {
        sign: 'File có nhiều cột/bảng phức tạp…',
        meaning: 'File có bảng hoặc dòng chia từ 3 cột trở lên. Mọi file có bảng đều hiện cảnh báo này.',
        action: 'Đọc lại từng dòng, đặc biệt thuộc tính nào đang thuộc sản phẩm nào.'
    },
    {
        sign: 'Trang N: chữ không đọc rõ / cần kiểm tra',
        meaning: 'AI đọc ảnh nhưng không chắc. Phần không rõ bị bỏ khỏi nội dung, không được đoán.',
        action: 'Mở file gốc, bổ sung phần còn thiếu bằng tay.'
    },
    {
        sign: 'Chỉ xử lý 80 trang đầu / Trang bị bỏ qua',
        meaning: 'Các trang vượt giới hạn không được đọc, nên không có trong bản chuẩn.',
        action: 'Cắt file theo sản phẩm hoặc chỉ giữ trang cần thiết rồi upload lại.'
    },
    {
        sign: 'AI đã loại N dòng',
        meaning: 'Sau khi bấm AI formatting, AI bỏ các dòng nó cho là watermark hoặc không liên quan. AI không sửa chữ.',
        action: 'Mở danh sách dòng bị loại, nếu có thông tin sản phẩm thì bấm Hủy và không áp dụng.'
    }
];

const EXTERNAL_AI_PROMPT = `Bạn là công cụ chuyển đổi tài liệu, không phải biên tập viên. Đọc tài liệu đính kèm và chép lại toàn bộ thông tin mô tả sản phẩm thành văn bản thuần.

Quy tắc:
1. Chép nguyên văn từng chữ, từng con số, đơn vị và dấu phân cách (1.200 khác 1,2). Không tóm tắt, không diễn giải, không dịch, không sửa chính tả.
2. Mỗi sản phẩm một khối riêng, bắt đầu bằng tên sản phẩm. Thuộc tính viết dạng "Tên thuộc tính: giá trị", mỗi thuộc tính một dòng.
3. Không chuyển thuộc tính của sản phẩm này sang sản phẩm khác. Nếu không chắc thuộc sản phẩm nào, ghi [KHÔNG CHẮC: ...].
4. Chữ không đọc rõ thì ghi [KHÔNG RÕ], tuyệt đối không đoán.
5. Giữ nguyên điều kiện, thời hạn, khuyến cáo đi kèm giá hoặc khuyến mãi.
6. Bỏ watermark, số trang, header, footer, logo. Không thêm nhận xét.`;

const CHECKLIST = [
    'Đọc lại từng con số: giá, %, dung tích, hạn dùng, điều kiện và thời hạn khuyến mãi.',
    'Mỗi sản phẩm một mục riêng, thuộc tính không bị lẫn sang sản phẩm bên cạnh.',
    'Không còn dấu [KHÔNG RÕ] hoặc [KHÔNG CHẮC] trong nội dung.',
    'Điều kiện hoặc khuyến cáo bắt buộc khi truyền thông đã được viết rõ (ví dụ "Phải nêu: …").',
    'Nếu dùng AI formatting, đã mở danh sách dòng bị loại và không mất thông tin cần thiết.'
];

const Section = ({ title, children }) => (
    <section className="space-y-2">
        <h4 className="text-xs font-bold text-gray-900">{title}</h4>
        {children}
    </section>
);

const ProductDescriptionLegend = ({ defaultOpen = false }) => {
    const [open, setOpen] = useState(defaultOpen);
    const [copied, setCopied] = useState(false);

    const copyPrompt = async () => {
        try {
            await navigator.clipboard.writeText(EXTERNAL_AI_PROMPT);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Trình duyệt chặn clipboard: người dùng vẫn bôi đen và copy tay được từ khung bên dưới.
        }
    };

    return (
        <div className="mb-4 overflow-hidden rounded-xl border border-blue-200 bg-blue-50/40">
            <button
                type="button"
                onClick={() => setOpen((value) => !value)}
                aria-expanded={open}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
            >
                <Info className="h-4 w-4 shrink-0 text-blue-600" />
                <span className="min-w-0 flex-1 text-xs font-bold text-blue-800">
                    Chú giải: thông tin chuẩn được QC dùng như thế nào và cách chuẩn bị file
                </span>
                {open ? (
                    <ChevronUp className="h-4 w-4 shrink-0 text-blue-500" />
                ) : (
                    <ChevronDown className="h-4 w-4 shrink-0 text-blue-500" />
                )}
            </button>

            {open && (
                <div className="space-y-5 border-t border-blue-100 bg-white p-4 text-xs leading-relaxed text-gray-700">
                    <Section title="Luồng xử lý">
                        <ol className="space-y-1.5">
                            {PIPELINE.map((step, index) => (
                                <li key={step.title} className="flex gap-2">
                                    <span className="mt-px flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-700">
                                        {index + 1}
                                    </span>
                                    <span>
                                        <span className="font-semibold text-gray-900">{step.title}.</span> {step.body}
                                    </span>
                                </li>
                            ))}
                        </ol>
                    </Section>

                    <Section title="QC đọc gì từ bản chuẩn">
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3">
                                <p className="mb-1.5 flex items-center gap-1.5 font-bold text-emerald-700">
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    QC dùng
                                </p>
                                <ul className="list-disc space-y-1 pl-4">
                                    {QC_USES.map((item) => <li key={item}>{item}</li>)}
                                </ul>
                            </div>
                            <div className="rounded-lg border border-rose-200 bg-rose-50/50 p-3">
                                <p className="mb-1.5 flex items-center gap-1.5 font-bold text-rose-700">
                                    <XCircle className="h-3.5 w-3.5" />
                                    QC không dùng
                                </p>
                                <ul className="list-disc space-y-1 pl-4">
                                    {QC_IGNORES.map((item) => <li key={item}>{item}</li>)}
                                </ul>
                            </div>
                        </div>
                        <p className="text-gray-500">
                            Vì QC chỉ đọc chữ, một con số sai hoặc thiếu ở đây sẽ làm QC báo nhầm hoặc bỏ sót lỗi ở kịch bản.
                            Sửa bản chuẩn sau khi đã duyệt thì phải gửi duyệt lại; QC tiếp tục dùng phiên bản cũ cho đến khi bản mới được duyệt.
                        </p>
                    </Section>

                    <Section title="QC đối chiếu theo ý nghĩa, không dò chữ trùng khớp">
                        <ul className="space-y-1.5">
                            {CHECK_TYPES.map((item) => (
                                <li key={item.label}>
                                    <span className="font-semibold text-gray-900">{item.label}.</span> {item.body}
                                </li>
                            ))}
                        </ul>
                        <p className="text-gray-500">
                            Cách viết khác nhau nhưng cùng nghĩa (20% và 20 phần trăm, 500ml và 0,5l, khác ngôn ngữ) không bị tính là lỗi.
                            Các con số trong kịch bản mà bản chuẩn không có sẽ được đánh dấu để QC soát từng số.
                        </p>
                    </Section>

                    <Section title="Cảnh báo bạn có thể gặp sau khi upload">
                        <div className="space-y-2">
                            {WARNINGS.map((item) => (
                                <div
                                    key={item.sign}
                                    className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-2.5"
                                >
                                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
                                    <div className="space-y-0.5">
                                        <p className="font-semibold text-amber-800">{item.sign}</p>
                                        <p>{item.meaning}</p>
                                        <p className="text-amber-800">
                                            <span className="font-semibold">Cần làm:</span> {item.action}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Section>

                    <Section title="Khuyến nghị để QC chính xác nhất">
                        <div className="space-y-3">
                            <div className="rounded-lg border border-gray-200 p-3">
                                <p className="mb-1 flex items-center gap-1.5 font-bold text-gray-900">
                                    <FileText className="h-3.5 w-3.5 text-emerald-600" />
                                    Cách tốt nhất: tự soạn tay hoặc chuẩn hóa file trước khi upload
                                </p>
                                <ul className="list-disc space-y-1 pl-4">
                                    <li>Soạn file .docx chỉ gồm chữ, mỗi sản phẩm một khối, thuộc tính viết dạng "Tên thuộc tính: giá trị".</li>
                                    <li>Chỉ upload file .pdf hoặc .docx. File .doc cũ cần lưu lại thành .docx trước.</li>
                                    <li>Nếu dùng bảng, điền "—" vào ô trống. Hệ thống bỏ ô trống khi đọc, các giá trị còn lại có thể bị dồn sang sai cột.</li>
                                    <li>Mỗi sản phẩm một mục riêng trong form. Không dồn nhiều sản phẩm vào một file khi chúng có thuộc tính khác nhau.</li>
                                </ul>
                            </div>

                            <div className="rounded-lg border border-gray-200 p-3">
                                <p className="mb-1 flex items-center gap-1.5 font-bold text-gray-900">
                                    <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                                    Tài liệu gốc là ảnh, slide, Excel hoặc brochure nhiều cột: nhờ AI bên ngoài chuyển sang văn bản
                                </p>
                                <ul className="list-disc space-y-1 pl-4">
                                    <li>Dùng AI ngoài (ChatGPT, Claude, Gemini…) để chép tài liệu thành văn bản, lưu thành .docx hoặc .pdf rồi mới upload.</li>
                                    <li>Yêu cầu AI chép nguyên văn, không tóm tắt. Dùng prompt mẫu bên dưới.</li>
                                    <li>AI ngoài cũng có thể đọc sai số. Luôn đối chiếu lại các con số với tài liệu gốc trước khi gửi duyệt.</li>
                                </ul>

                                <div className="mt-2 rounded-lg border border-gray-200 bg-gray-50">
                                    <div className="flex items-center justify-between gap-2 border-b border-gray-200 px-3 py-1.5">
                                        <span className="font-semibold text-gray-600">Prompt mẫu cho AI ngoài</span>
                                        <button
                                            type="button"
                                            onClick={copyPrompt}
                                            className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-2 py-1 text-[11px] font-bold text-gray-700 hover:bg-gray-100"
                                        >
                                            <Copy className="h-3 w-3" />
                                            {copied ? 'Đã sao chép' : 'Sao chép'}
                                        </button>
                                    </div>
                                    <pre className="max-h-48 overflow-y-auto whitespace-pre-wrap px-3 py-2 font-sans text-[11px] leading-relaxed text-gray-700">
                                        {EXTERNAL_AI_PROMPT}
                                    </pre>
                                </div>
                            </div>

                            <div className="rounded-lg border border-gray-200 p-3">
                                <p className="mb-1 font-bold text-gray-900">Nên tránh</p>
                                <ul className="list-disc space-y-1 pl-4">
                                    <li>PDF scan mờ, ảnh chụp màn hình hoặc chụp bằng điện thoại.</li>
                                    <li>Thông tin quan trọng chỉ nằm trong hình minh họa của trang có chữ. Hệ thống không đọc ảnh trong các trang này.</li>
                                    <li>Trang nhiều cột hoặc nhiều khối đè lên ảnh nền, vì thứ tự đọc dễ bị đảo.</li>
                                </ul>
                            </div>
                        </div>
                    </Section>

                    <Section title="Trước khi bấm gửi duyệt">
                        <ul className="space-y-1.5">
                            {CHECKLIST.map((item) => (
                                <li key={item} className="flex items-start gap-2">
                                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </Section>
                </div>
            )}
        </div>
    );
};

export default ProductDescriptionLegend;
