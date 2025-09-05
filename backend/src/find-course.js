"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("./lib/database"));
function findCourse() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const prisma = database_1.default.getInstance();
            const course = yield prisma.course.findFirst({
                where: { code: 'CS301' }
            });
            console.log('CS301 course:', course);
            // Also check enrollments for this course
            if (course) {
                const enrollments = yield prisma.studentEnrollment.findMany({
                    where: {
                        offering: {
                            courseId: course.id
                        }
                    },
                    include: {
                        student: {
                            include: { user: true }
                        },
                        offering: {
                            include: { course: true }
                        }
                    },
                    take: 5
                });
                console.log('Sample enrollments for CS301:', enrollments.length);
                enrollments.forEach(enrollment => {
                    var _a, _b;
                    console.log(`- ${(_a = enrollment.student) === null || _a === void 0 ? void 0 : _a.user.name} (${(_b = enrollment.student) === null || _b === void 0 ? void 0 : _b.usn})`);
                });
            }
        }
        catch (error) {
            console.error('Error:', error);
        }
        finally {
            yield database_1.default.getInstance().$disconnect();
        }
    });
}
findCourse();
