import React from 'react';
import { CreditCard, Calendar, FileText, CheckCircle2 } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { DocumentCard } from '../common/DocumentCard';
import { formatNumber } from '../../utils/format';

export const PaymentDetailModal = ({ isOpen, onClose, payment }) => {
    if (!isOpen || !payment) return null;

    const attachments = payment.attachments || [];

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Chi tiết giao dịch thanh toán"
            className="max-w-lg"
        >
            <div className="space-y-5">
                {/* Amount Highlight Card */}
                <div className="p-4 bg-emerald-50/70 border border-emerald-100 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                            <CreditCard className="w-5 h-5" />
                        </div>
                        <div>
                            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                                Số tiền đã nộp
                            </span>
                            <div className="text-xl font-extrabold text-emerald-600">
                                {formatNumber(payment.amount)}{' '}
                                <span className="text-xs font-semibold text-emerald-700">VNĐ</span>
                            </div>
                        </div>
                    </div>
                    <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Đã ghi nhận</span>
                    </div>
                </div>

                {/* Metadata Details */}
                <div className="grid grid-cols-1 gap-3 bg-gray-50/70 p-4 rounded-xl border border-gray-100 text-sm">
                    <div className="flex items-center justify-between py-1 border-b border-gray-200/60">
                        <span className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            Ngày thanh toán
                        </span>
                        <span className="text-sm font-semibold text-gray-800">
                            {new Date(payment.paymentDate).toLocaleDateString('vi-VN')}
                        </span>
                    </div>

                    <div className="py-1">
                        <span className="text-xs font-medium text-gray-500 flex items-center gap-1.5 mb-1">
                            <FileText className="w-4 h-4 text-gray-400" />
                            Ghi chú
                        </span>
                        <p className="text-sm text-gray-700 bg-white p-2.5 rounded-lg border border-gray-200 whitespace-pre-wrap">
                            {payment.note ? payment.note : <span className="text-gray-400 italic">Không có ghi chú</span>}
                        </p>
                    </div>
                </div>

                {/* Attached Documents / Proofs */}
                <div>
                    <h5 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center justify-between">
                        <span>Chứng từ đính kèm</span>
                        <span className="text-[11px] font-medium text-gray-400">
                            {attachments.length} tệp
                        </span>
                    </h5>

                    {attachments.length > 0 ? (
                        <div className="space-y-2">
                            {attachments.map((file, idx) => (
                                <DocumentCard
                                    key={idx}
                                    url={file.url}
                                    fileName={file.name || `Chung_tu_${idx + 1}`}
                                    fileSize={file.size ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : ''}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="p-4 bg-gray-50 border border-dashed border-gray-200 rounded-xl text-center text-xs text-gray-400 italic">
                            Không có chứng từ đính kèm cho đợt thanh toán này.
                        </div>
                    )}
                </div>

                {/* Footer Action */}
                <div className="pt-3 border-t border-gray-100 flex justify-end">
                    <Button variant="secondary" onClick={onClose} className="px-5">
                        Đóng
                    </Button>
                </div>
            </div>
        </Modal>
    );
};
